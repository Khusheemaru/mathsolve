#!/usr/bin/env python3
"""
prerender_asy.py – Asymptote Pre-rendering Pipeline for MathSolve
===================================================================
What this does:
  1. Connects to your Supabase DB and fetches every problem that still
     contains an [asy]...[/asy] block in statement_latex or solution_latex.
  2. For each [asy] block it:
       a. writes a temp .asy file
       b. calls the local `asy` binary to compile it to a .png
       c. uploads the .png to Supabase Storage (bucket: geometry-diagrams)
       d. replaces [asy]...[/asy] in the DB row with an image link
  3. Updates the row live, so your site immediately starts showing real images.

Prerequisites (run ONCE before this script):
  1. Install Asymptote for Windows:
       Download the installer from https://asymptote.sourceforge.io/
       Then ensure `asy.exe` is on your PATH.
  2. Install GhostScript (needed by asy to produce PNG):
       https://www.ghostscript.com/releases/gsdnld.html  (choose win64)
  3. pip install supabase python-dotenv pillow
  4. In your Supabase dashboard → Storage → create a PUBLIC bucket named:
         geometry-diagrams
  5. Make sure your .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
     plus SUPABASE_SERVICE_ROLE_KEY (needed for Storage uploads from server)

Run with:
  python scripts/prerender_asy.py [--dry-run]
"""

import os, re, sys, uuid, shutil, tempfile, subprocess, argparse
from pathlib import Path
from dotenv import load_dotenv

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: Run `pip install supabase python-dotenv` first.")
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

SUPABASE_URL  = os.getenv('VITE_SUPABASE_URL')
# Use service role key so Storage uploads bypass RLS
SUPABASE_KEY  = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
STORAGE_BUCKET = 'geometry-diagrams'
ASY_BINARY    = shutil.which('asy') or r'C:\Program Files\Asymptote\asy.exe'

ASY_PATTERN = re.compile(r'\[asy\]([\s\S]*?)\[/asy\]', re.IGNORECASE)

# ── Helpers ────────────────────────────────────────────────────────────

def compile_asy_to_png(asy_code: str) -> bytes | None:
    """Compile raw Asymptote code into PNG bytes using local asy binary."""
    if not Path(ASY_BINARY).exists():
        print(f"  ✗ Asymptote binary not found at: {ASY_BINARY}")
        print("    → Download from https://asymptote.sourceforge.io/ and add to PATH")
        return None

    with tempfile.TemporaryDirectory() as tmpdir:
        asy_file = Path(tmpdir) / 'diagram.asy'
        png_file = Path(tmpdir) / 'diagram.png'

        # Write a self-contained asy file with default settings for clean PNG output
        header = 'settings.outformat="png";\nsettings.render=4;\nsize(200);\n'
        asy_file.write_text(header + asy_code, encoding='utf-8')

        result = subprocess.run(
            [ASY_BINARY, '-f', 'png', '-o', str(png_file), str(asy_file)],
            capture_output=True, text=True, timeout=60
        )

        if result.returncode != 0:
            print(f"  ✗ asy compile error:\n{result.stderr[:300]}")
            return None

        if not png_file.exists():
            print("  ✗ asy ran but produced no output file")
            return None

        return png_file.read_bytes()


def upload_to_storage(supabase: 'Client', png_bytes: bytes, problem_id: str, idx: int) -> str | None:
    """Upload PNG bytes to Supabase Storage and return the public URL."""
    filename = f"{problem_id}_{idx}.png"
    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=filename,
            file=png_bytes,
            file_options={"content-type": "image/png", "upsert": "true"}
        )
        # Build public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
        return public_url
    except Exception as e:
        print(f"  ✗ Storage upload failed: {e}")
        return None


def replace_asy_in_text(text: str, problem_id: str, supabase: 'Client', dry_run: bool) -> str | None:
    """Replace all [asy] blocks in `text` with <img> tags. Returns new text or None if unchanged."""
    if '[asy]' not in text.lower():
        return None

    matches = list(ASY_PATTERN.finditer(text))
    if not matches:
        return None
    
    new_text = text
    offset = 0
    changed = False

    for idx, m in enumerate(matches):
        asy_code = m.group(1).strip()
        print(f"    Compiling diagram {idx+1}/{len(matches)} …")
        
        if dry_run:
            img_tag = f'[DRY-RUN: diagram_{idx+1}.png would be here]'
        else:
            png_bytes = compile_asy_to_png(asy_code)
            if png_bytes is None:
                img_tag = f'\n[Geometry diagram – could not render]\n'
            else:
                url = upload_to_storage(supabase, png_bytes, problem_id, idx)
                if url:
                    img_tag = f'\n![Geometry Diagram]({url})\n'
                    print(f"    ✓ Uploaded → {url}")
                else:
                    img_tag = f'\n[Geometry diagram – upload failed]\n'

        # Replace in new_text keeping offset in sync
        start = m.start() + offset
        end   = m.end()   + offset
        new_text = new_text[:start] + img_tag + new_text[end:]
        offset  += len(img_tag) - (m.end() - m.start())
        changed = True

    return new_text if changed else None


# ── Main ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Pre-render Asymptote blocks in Supabase DB')
    parser.add_argument('--dry-run', action='store_true', help='Scan only, do not compile or update DB')
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set in .env")
        sys.exit(1)

    print(f"🔗 Connecting to Supabase: {SUPABASE_URL[:40]}…")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch problems containing [asy]
    print("🔍 Scanning database for [asy] blocks …")
    all_rows = []
    limit = 1000
    offset = 0
    while True:
        res = supabase.table('problems').select('id, statement_latex, solution_latex').range(offset, offset + limit - 1).execute()
        if not res.data:
            break
        for row in res.data:
            stmt = row.get('statement_latex', '') or ''
            soln = row.get('solution_latex', '') or ''
            if '[asy]' in stmt.lower() or '[asy]' in soln.lower():
                all_rows.append(row)
        if len(res.data) < limit:
            break
        offset += limit

    print(f"Found {len(all_rows)} problems with [asy] blocks.\n")

    if args.dry_run:
        print("DRY-RUN mode – no compilations or DB writes will happen.\n")

    success = 0
    fail    = 0

    for i, row in enumerate(all_rows, 1):
        pid = row['id']
        print(f"[{i}/{len(all_rows)}] Problem {pid}")

        updates = {}

        new_stmt = replace_asy_in_text(row.get('statement_latex') or '', pid, supabase, args.dry_run)
        if new_stmt:
            updates['statement_latex'] = new_stmt

        new_soln = replace_asy_in_text(row.get('solution_latex') or '', pid, supabase, args.dry_run)
        if new_soln:
            updates['solution_latex'] = new_soln

        if updates and not args.dry_run:
            try:
                supabase.table('problems').update(updates).eq('id', pid).execute()
                print(f"  ✓ DB row updated.")
                success += 1
            except Exception as e:
                print(f"  ✗ DB update failed: {e}")
                fail += 1
        elif updates:
            print(f"  [DRY-RUN] Would update row {pid}")
            success += 1
        else:
            print(f"  — No changes needed.")

    print(f"\n✅ Done! {success} rows updated, {fail} failed.")
    if fail > 0:
        print("   Re-run the script to retry failed rows.")


if __name__ == '__main__':
    main()
