
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to the home page
  return <Navigate to="/" replace />;
};

export default Index;
