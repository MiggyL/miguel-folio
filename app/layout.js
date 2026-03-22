import './globals.css'

export const metadata = {
  title: 'Miguel Portfolio',
  description: 'Meet Miguel\'s Digital Twin - an Interactive Resume. Chat with Miguel\'s AI assistant to learn about his skills, experience, and projects.',
  openGraph: {
    title: 'Miguel Portfolio',
    description: 'Meet Miguel\'s Digital Twin - an Interactive Resume. Chat with Miguel\'s AI assistant to learn about his skills, experience, and projects.',
    url: 'https://miguel-folio.pages.dev',
    siteName: 'Miguel Portfolio',
    images: [
      {
        url: 'https://miguel-folio.pages.dev/fb.png',
        width: 1200,
        height: 630,
        alt: 'Miguel\'s Digital Twin - Interactive Resume & Chat Interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miguel Portfolio',
    description: 'Meet Miguel\'s Digital Twin - an Interactive Resume. Chat with Miguel\'s AI assistant to learn about his skills, experience, and projects.',
    images: ['https://miguel-folio.pages.dev/fb.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}