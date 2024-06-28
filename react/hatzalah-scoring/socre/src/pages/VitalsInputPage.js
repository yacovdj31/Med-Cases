import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VitalsInput from '../components/VitalsInput';

const VitalsInputPage = () => {
    const navigate = useNavigate();
    const initialVitalState = {
        BPM: '',
        Oxygen: '',
        Glucose: '',
        BreathingRate: '',
        BP1: '',
        BP2: ''
    };

    const [id, setId] = useState(localStorage.getItem('id') || '');
    const [dispatchCall, setDispatchCall] = useState(localStorage.getItem('dispatchCall') || '');
    const [diagnosis, setDiagnosis] = useState(localStorage.getItem('diagnosis') || '');
    const [category, setCategory] = useState(localStorage.getItem('category') || 'Cardiac');
    const [initialHealthLevel, setInitialHealthLevel] = useState(localStorage.getItem('initialHealthLevel') || '');
    const [maxHealthLevel, setMaxHealthLevel] = useState(localStorage.getItem('maxHealthLevel') || '');
    const [initialVitals, setInitialVitals] = useState(JSON.parse(localStorage.getItem('initialVitals')) || initialVitalState);
    const [perfectVitals, setPerfectVitals] = useState(JSON.parse(localStorage.getItem('perfectVitals')) || initialVitalState);
    const [worseVitals, setWorseVitals] = useState(JSON.parse(localStorage.getItem('worseVitals')) || initialVitalState);
    const [character, setCharacter] = useState(localStorage.getItem('character') || '');

    useEffect(() => {
        localStorage.setItem('id', id);
        localStorage.setItem('dispatchCall', dispatchCall);
        localStorage.setItem('diagnosis', diagnosis);
        localStorage.setItem('category', category);
        localStorage.setItem('initialHealthLevel', initialHealthLevel);
        localStorage.setItem('maxHealthLevel', maxHealthLevel);
        localStorage.setItem('initialVitals', JSON.stringify(initialVitals));
        localStorage.setItem('perfectVitals', JSON.stringify(perfectVitals));
        localStorage.setItem('worseVitals', JSON.stringify(worseVitals));
        localStorage.setItem('character', character);
    }, [id, dispatchCall, diagnosis, category, initialHealthLevel, maxHealthLevel, initialVitals, perfectVitals, worseVitals, character]);

    const handleCharacterChange = (e) => {
        const value = e.target.value;
        setCharacter(value);
    };

    const handleSubmit = () => {
        navigate('/item-usage');
    };

    return (
        <div className="vitals-page">
            <div className="additional-info">
                <label>
                    ID:
                    <input type="number" value={id} onChange={(e) => setId(e.target.value)} min="1" max="99" />
                </label>
                <label>
                    Character (1-10):
                    <select value={character} onChange={handleCharacterChange}>
                        {[...Array(10).keys()].map((num) => (
                            <option key={num + 1} value={num + 1}>
                                {num + 1}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Dispatch Call:
                    <input type="text" value={dispatchCall} onChange={(e) => setDispatchCall(e.target.value)} />
                </label>
                <label>
                    Diagnosis:
                    <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                </label>
                <label>
                    Category:
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="Cardiac">Cardiac</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="Neurological">Neurological</option>
                        <option value="Environmental">Environmental</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
                <label>
                    Initial Health Level:
                    <input
                        type="number"
                        value={initialHealthLevel}
                        onChange={(e) => setInitialHealthLevel(e.target.value)}
                        min="1"
                        max="99"
                    />
                </label>
                <label>
                    Max Health Level:
                    <input
                        type="number"
                        value={maxHealthLevel}
                        onChange={(e) => setMaxHealthLevel(e.target.value)}
                        min="1"
                        max="99"
                    />
                </label>
            </div>
            <VitalsInput
                initialVitals={initialVitals}
                setInitialVitals={setInitialVitals}
                perfectVitals={perfectVitals}
                setPerfectVitals={setPerfectVitals}
                worseVitals={worseVitals}
                setWorseVitals={setWorseVitals}
            />
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default VitalsInputPage;
