import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToaster from '../components/ThemeToaster';
import '../styles/globals.css';

export const metadata = {
  title: 'ProjectMarket — Connect Buyers & Problem Solvers',
  description: 'A role-based project marketplace for buyers and problem solvers',
};

const themeScript = `
  (function() {
    var t = localStorage.getItem('projectmarket-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
