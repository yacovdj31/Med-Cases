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

    const [id, setId] = useState(sessionStorage.getItem('id') || '');
    const [dispatchCall, setDispatchCall] = useState(sessionStorage.getItem('dispatchCall') || '');
    const [diagnosis, setDiagnosis] = useState(sessionStorage.getItem('diagnosis') || '');
    const [category, setCategory] = useState(sessionStorage.getItem('category') || 'Cardiac');
    const [initialHealthLevel, setInitialHealthLevel] = useState(sessionStorage.getItem('initialHealthLevel') || '');
    const [maxHealthLevel, setMaxHealthLevel] = useState(sessionStorage.getItem('maxHealthLevel') || '');
    const [initialVitals, setInitialVitals] = useState(JSON.parse(sessionStorage.getItem('initialVitals')) || initialVitalState);
    const [perfectVitals, setPerfectVitals] = useState(JSON.parse(sessionStorage.getItem('perfectVitals')) || initialVitalState);
    const [worseVitals, setWorseVitals] = useState(JSON.parse(sessionStorage.getItem('worseVitals')) || initialVitalState);
    const [character, setCharacter] = useState(sessionStorage.getItem('character') || '');

    useEffect(() => {
        sessionStorage.setItem('id', id);
        sessionStorage.setItem('dispatchCall', dispatchCall);
        sessionStorage.setItem('diagnosis', diagnosis);
        sessionStorage.setItem('category', category);
        sessionStorage.setItem('initialHealthLevel', initialHealthLevel);
        sessionStorage.setItem('maxHealthLevel', maxHealthLevel);
        sessionStorage.setItem('initialVitals', JSON.stringify(initialVitals));
        sessionStorage.setItem('perfectVitals', JSON.stringify(perfectVitals));
        sessionStorage.setItem('worseVitals', JSON.stringify(worseVitals));
        sessionStorage.setItem('character', character);
    }, [id, dispatchCall, diagnosis, category, initialHealthLevel, maxHealthLevel, initialVitals, perfectVitals, worseVitals, character]);

    const handleCharacterChange = (e) => {
        const value = e.target.value;
        setCharacter(value);
    };

    const handleSubmit = () => {
        const summaryData = {
            id,
            character,
            dispatchCall,
            diagnosis,
            category,
            initialHealthLevel,
            maxHealthLevel,
            initialVitals,
            perfectVitals,
            worseVitals
        };

        localStorage.setItem('summaryData', JSON.stringify(summaryData));
        console.log('Summary Data:', summaryData);  // Console log the whole summary data
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
