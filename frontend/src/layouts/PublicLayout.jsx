// Public layout for public-facing routes
// PCL — Circuit Canopy PublicLayout
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PublicLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, marginTop: '66px', background: '#081916' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
