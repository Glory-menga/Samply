import AnimatedBackground from "../components/background/AnimatedBackground";

function PhoneOrTablet(){
    return(
        <>
        <AnimatedBackground />
        <div className="phone-container">
            <p>We recommend using a desktop or laptop computer to generate samples.</p>
        </div>
        </>
    );
}

export default PhoneOrTablet;