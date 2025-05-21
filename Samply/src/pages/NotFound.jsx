import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/Background/AnimatedBackground';
function NotFound(){
    return(
        <>
            <AnimatedBackground/>
            <div className='not-found'>
                <h1>404 - Page Not Found</h1>
                <p>Oops! The page you are looking for does not exist.</p>
                <p> Go back to <Link to="/">Home</Link></p>
            </div>
        </>
    );
}

export default NotFound;