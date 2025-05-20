import Nav from '../components/Nav';
import Galaxy from '../components/3dObjects/Galaxy';

function Home(){
    return(
        <>
            <Nav />
            <div className='space'>
                <Galaxy/>
            </div>
            <div className="container-space">
                <h1>Home</h1>
            </div>
        </>
    );
}

export default Home;