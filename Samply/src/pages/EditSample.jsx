import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from '../components/3dObjects/Galaxy';
import { Play } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import Knob from '../components/Knob';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { Save, ArrowDownToLine } from 'lucide-react';
import '../css/EditSample.css';

function EditSample(){
    const navigate = useNavigate();
    const [tempoValue, setTempoValue] = useState(2);
    const tempoLevels = ['Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'];

    return(
        <>
            <div className='space'>
                <Galaxy />
            </div>
            <div className="edit-sample-container">
                <div className="back">
                    <button onClick={() => navigate(-1)}> <p>Back to the generated samples</p></button>
                </div>
                <div className='edit-sample-wrapper'>
                    <h1>Jazzy melody with a slow tempo</h1>
                    <div className='edit-metaball'>
                        <div className='edit-pitch-semitones'>
                            <Knob />
                            <div className='reverse-toggle'> 
                                <Checkbox.Root
                                className="checkbox-custom"
                                id="reverse"
                                onCheckedChange={(checked) => {
                                console.log("Reverse is", checked ? "ON" : "OFF");
                                // You can update state here if needed
                                }}
                            >
                                <Checkbox.Indicator className="checkbox-indicator">
                                <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <p>Reverse: OFF</p>
                            </div>
                        </div>
                        <div className='placement-metaball'>
                            <Metaball width="100%" height="100%" sphereScale={1.4}/>
                        </div>
                        <div className='edit-tempo'>
                            <div className="tempo-slider-wrapper">
                            <input
                                type="range"
                                min="0"
                                max="4"
                                step="1"
                                value={4 - tempoValue}
                                onChange={(e) => setTempoValue(4 - Number(e.target.value))}
                                className="tempo-slider"
                            />
                            <p className="tempo-label">Tempo : {tempoLevels[tempoValue]}</p>
                            </div>
                        </div>
                    </div>
                    <div className='timestamps-edit-sample'>
                        <Play size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                        <div className='time-sample'>
                            <p>00:00</p>
                            <p>/</p>
                            <p>00:50</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='edit-sample-icons'>
                <Save size={32} strokeWidth={1} color='#fff'/>
                <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
            </div>
        </>
    );
}

export default EditSample;