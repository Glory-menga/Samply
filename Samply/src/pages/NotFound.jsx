/**
 * Displays a 404 error page for undefined routes
 * Includes a message and a link to navigate back to the home page
 */
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/background/AnimatedBackground';
import '../css/NotFound.css';

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