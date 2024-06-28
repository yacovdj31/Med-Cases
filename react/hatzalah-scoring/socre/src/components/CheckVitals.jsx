import React from 'react';

const CheckVitals = ({ vitalsCheck, setVitalsCheck }) => {
    const vitals = [
        'Oxygen',
        'BPM',
        'BP',
        'BreathingRate',
        'Glucose'
    ];

    const handleChange = (vital, value) => {
        setVitalsCheck(prevCheck => ({
            ...prevCheck,
            [vital]: prevCheck[vital] === value ? '' : value
        }));
    };

    return (
        <div className="check-vitals-page">
            <h1>Check Vitals</h1>
            <div className="vitals-list">
                {vitals.map((vital, index) => (
                    <div key={index} className="vital-entry">
                        <span>{vital}</span>
                        <label>
                            <input
                                type="checkbox"
                                checked={vitalsCheck[vital] === 'once'}
                                onChange={() => handleChange(vital, 'once')}
                            />
                            Once
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={vitalsCheck[vital] === 'twice'}
                                onChange={() => handleChange(vital, 'twice')}
                            />
                            Twice
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CheckVitals;
