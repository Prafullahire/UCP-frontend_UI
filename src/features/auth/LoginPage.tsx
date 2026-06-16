
import { useNavigate } from 'react-router-dom';
import { useReportsStore } from '../../store/useReportsStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);

  const handleLogin = () => {
    // In a real app, this would perform an API call.
    // For now, our ordersApi.ts automatically fetches a dev token if it's missing,
    // so we can just redirect to dashboard.
    showToast('Logged in successfully');
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F7F3' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '24px', color: '#1A190F' }}>Welcome Back</h1>
        <p style={{ color: '#6B6960', marginBottom: '24px' }}>Please log in to your account.</p>
        <button 
          onClick={handleLogin}
          style={{ 
            background: '#F07C00', 
            color: '#fff', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            fontWeight: 600,
            cursor: 'pointer' 
          }}
        >
          Login to Account
        </button>
      </div>
    </div>
  );
}
