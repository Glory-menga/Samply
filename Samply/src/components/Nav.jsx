import { Link } from 'react-router-dom';

function Nav(){
    return(
        <nav>
            <div className='logo'>
                <Link to="/">Samply</Link>
            </div>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/generate">Generate</Link></li>
                <li><Link to="/samples">Samples</Link></li>
                <li><Link to="/community">Community</Link></li>
                <li className='line-nav'></li>
                <li><Link to="/profile">Profile</Link></li>
            </ul>
        </nav>
    );
}

export default Nav;