import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata={
  title:'Shivaay Paridhan — The Art of Indian Draping',
  description:'Premium Indian sarees and timeless elegance.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
