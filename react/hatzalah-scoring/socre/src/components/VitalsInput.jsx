import React from 'react';

const VitalsInput = ({ initialVitals, setInitialVitals, perfectVitals, setPerfectVitals, worseVitals, setWorseVitals }) => {
    const handleChange = (e, setVitals, vitals) => {
        const { name, value } = e.target;
        setVitals({
            ...vitals,
            [name]: value
        });
    };

    return (
        <div className="vitals-input-page">
            <h1>Initial Vitals</h1>
            <div className="vitals-list">
                {Object.keys(initialVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        <input
                            type="text"
                            name={vital}
                            value={initialVitals[vital]}
                            onChange={(e) => handleChange(e, setInitialVitals, initialVitals)}
                            maxLength="5"
                        />
                    </div>
                ))}
            </div>

            <h1>Perfect Vitals</h1>
            <div className="vitals-list">
                {Object.keys(perfectVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        <input
                            type="text"
                            name={vital}
                            value={perfectVitals[vital]}
                            onChange={(e) => handleChange(e, setPerfectVitals, perfectVitals)}
                            maxLength="5"
                        />
                    </div>
                ))}
            </div>

            <h1>Worse Vitals</h1>
            <div className="vitals-list">
                {Object.keys(worseVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        <input
                            type="text"
                            name={vital}
                            value={worseVitals[vital]}
                            onChange={(e) => handleChange(e, setWorseVitals, worseVitals)}
                            maxLength="5"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VitalsInput;


