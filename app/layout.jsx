export const metadata = {
  title: 'سوداكاش | SudaCash',
  description: 'دليل الكاش اليدوي والشبكات في السودان',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
