import { Link } from "react-router";
import { Heart } from "lucide-react";

function LikedSamplesTab() {
 return (
    <>
        <div className="tab">
            <Link to='/liked-samples' className="liked-samples">
                <Heart size={24} strokeWidth={1} color='#000'/>
                <p className="liked-samples-text">Liked Samples</p>
            </Link>
        </div>
    </>
 );
}

export default LikedSamplesTab