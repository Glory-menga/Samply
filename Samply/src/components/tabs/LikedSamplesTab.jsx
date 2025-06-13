import { Link } from "react-router";
import { Heart } from "lucide-react";
import '../../css/Tabs.css';

/**
 * LikedSamplesTab component
 * - Displays a clickable tab linking to the "Liked Samples" page
 * - Includes a heart icon and text
 * - Styled using external CSS
 */
function LikedSamplesTab() {
  return (
    <>
      <div className="tab">
        <Link to='/liked-samples' className="liked-samples">
          <Heart size={24} strokeWidth={1} color='#000' />
          <p className="liked-samples-text">Liked Samples</p>
        </Link>
      </div>
    </>
  );
}

export default LikedSamplesTab;
