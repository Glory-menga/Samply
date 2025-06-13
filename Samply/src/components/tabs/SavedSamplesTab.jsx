import { Link } from "react-router";
import { Save } from "lucide-react";
import '../../css/Tabs.css';

/**
 * SavedSamplesTab component
 * - Displays a clickable tab linking to the "Saved Samples" page
 * - Includes a save icon and descriptive text
 * - Styled using external CSS
 */
function SavedSamplesTab() {
  return (
    <>
      <div className="tab">
        <Link to='/saved-samples' className="saved-samples">
          <Save size={24} strokeWidth={1} color='#000' />
          <p className="saved-samples-text">Saved Samples</p>
        </Link>
      </div>
    </>
  );
}

export default SavedSamplesTab;
