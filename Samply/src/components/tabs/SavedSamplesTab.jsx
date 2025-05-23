import { Link } from "react-router";
import { Save } from "lucide-react";

function SavedSamplesTab() {
 return (
    <>
        <div className="tab">
            <Link to='/saved-samples' className="saved-samples">
                <Save size={24} strokeWidth={1} color='#000'/>
                <p className="saved-samples-text">Saved Samples</p>
            </Link>
        </div>
    </>
 );
}

export default SavedSamplesTab