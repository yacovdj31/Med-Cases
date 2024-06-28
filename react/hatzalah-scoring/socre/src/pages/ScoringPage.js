// src/pages/ScoringPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ScoringPage = () => {
    const navigate = useNavigate();
    const [scores, setScores] = useState({
        conversation: 0,
        correctApplication: 0,
        correctApplicationOrder: 0,
        correctVitalCheck: 0,
        correctDiagnosis: 0,
        correctOrderOfAllProcesses: 0
    });
    const [totalScore, setTotalScore] = useState(0);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        const newValue = Math.min(parseInt(value) || 0, 100);
        const newScores = { ...scores, [field]: newValue };
        const newTotalScore = Object.values(newScores).reduce((acc, score) => acc + score, 0);

        if (newTotalScore <= 100 || newValue < scores[field]) {
            setScores(newScores);
            setTotalScore(newTotalScore);
        }
    };

    const handleBlur = (field) => {
        if (scores[field] === '') {
            setScores({ ...scores, [field]: 0 });
        }
    };

    const handleSubmit = () => {
        if (totalScore !== 100) {
            setError('The total score must equal 100%.');
            return;
        }
        localStorage.setItem('scoringData', JSON.stringify(scores));
        navigate('/summary');
    };

    return (
        <div className="scoring-page">
            <h1>Scoring</h1>
            <div className="scoring-list">
                {Object.entries(scores).map(([field, score], index) => (
                    <div key={index} className="scoring-entry">
                        <span>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <input
                            type="number"
                            value={score}
                            onChange={(e) => handleChange(field, e.target.value)}
                            onBlur={() => handleBlur(field)}
                            min="0"
                            max="100"
                            step="1"
                        />
                        <span>%</span>
                    </div>
                ))}
                <div>Total: {totalScore}%</div>
                {error && <div className="error">{error}</div>}
            </div>
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default ScoringPage;
