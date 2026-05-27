import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          
          {/* Brand Info */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon">Σ</div>
              <span className="logo-text">MathSolve</span>
            </Link>
            <p className="brand-description">
              A premium open-source math Olympiad and problem-solving platform. 
              Keep your math edge sharp with curated challenges from Putnam, IMO, and beyond.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/solve">Solve Problems</Link></li>
              <li><Link to="/archive">Archive</Link></li>
              <li><Link to="/leaderboard">Leaderboard</Link></li>
              <li><Link to="/history">Solving History</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-links-col">
            <h4 className="footer-title">Community</h4>
            <ul className="footer-links">
              <li>
                <a href="https://github.com/Khusheemaru/mathsolve" target="_blank" rel="noopener noreferrer">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://github.com/Khusheemaru/mathsolve/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                  Contributing Guide
                </a>
              </li>
              <li>
                <a href="https://github.com/Khusheemaru/mathsolve/issues" target="_blank" rel="noopener noreferrer">
                  Report a Bug
                </a>
              </li>
            </ul>
          </div>

          {/* Contact / Social */}
          <div className="footer-contact-col">
            <h4 className="footer-title">Get Support</h4>
            <p className="contact-text">
              Have questions, feedback, or want to collaborate? Start a discussion or open an issue on our GitHub repository.
            </p>
            <a href="https://github.com/Khusheemaru/mathsolve/discussions" target="_blank" rel="noopener noreferrer" className="btn-email">
              💬 Open Q&A & Support
            </a>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} MathSolve. Open source under the MIT License.
          </p>
          <div className="footer-social-icons">
            <a href="https://github.com/Khusheemaru/mathsolve" target="_blank" rel="noopener noreferrer" title="GitHub">
              GitHub
            </a>
            <span className="divider">·</span>
            <a href="https://github.com/Khusheemaru/mathsolve/issues" target="_blank" rel="noopener noreferrer" title="Issues">
              Report Issues
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
