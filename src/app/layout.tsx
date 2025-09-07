import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Face Anonymization System",
  description: "Real-time face anonymization for CCTV feeds to protect privacy",
  keywords: ["privacy", "face detection", "anonymization", "CCTV", "security"],
  robots: "noindex, nofollow", // Privacy-focused: prevent indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="privacy-policy" content="Data processed locally for privacy protection" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FA</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Face Anonymization</h1>
                    <p className="text-sm text-gray-400">Privacy Protection System</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Privacy Protected</span>
                </div>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          
          <footer className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm mt-12">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-sm text-gray-400 mb-4 md:mb-0">
                  <p>© 2024 Face Anonymization System. Privacy First.</p>
                  <p className="text-xs mt-1">All video processing happens locally on your device.</p>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Client-side Processing</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No Data Upload</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>GDPR Compliant</span>
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}