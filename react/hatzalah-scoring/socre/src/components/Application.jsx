

import React, { useState, useEffect } from 'react';

const Application = ({ itemUsage, setApplicationInputs }) => {
    const defaultItems = [
        'Pulse Oximeter',
        'Stethoscope-BP',
        'Tourniquet',
        'Inhaler',
        'Epinephrine',
        'Oxygen tank',
        'Non-Rebreather',
        'Stethoscope-Breathing',
        'Supine Position With Feet Raised',
        'Supine Position',
        'CPAP',
        'Insulin',
        'Cervical Collar',
        'IV',
        'Nitroglycerin',
        'Tripod Position',
        'Triangle Bandage',
        'Glucometer',
        'Listen-Breathing',
        'Package Gauze',
        'Thermometer',
        'Epinephrine',
        'Aspirin',
        'Antiseptic Wipes',
        'Antihistamines',
        'Cold Packs',
        'Heat Packs',
        'Tweezers',
        'Scissors',
        'Glucogel',
        'Fowler Position',
        'Thermal Blanket',
        'Flashlight',
        'Surgical Gloves'
    ];

    const [applicationInputs, setApplicationInputsState] = useState(
        defaultItems.reduce((acc, item) => ({ ...acc, [item]: [] }), {})
    );
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setApplicationInputsState(
            defaultItems.reduce((acc, item) => ({ ...acc, [item]: Array(itemUsage[item] || 0).fill(0) }), {})
        );
    }, [itemUsage]);

    useEffect(() => {
        setApplicationInputs(applicationInputs);
    }, [applicationInputs, setApplicationInputs]);

    const handleChange = (item, index, value) => {
        let newValue = parseInt(value) || 0;
        const updatedInputs = applicationInputs[item].map((input, idx) => (idx === index ? newValue : input));
        const updatedTotal = Object.values(applicationInputs)
            .flat()
            .reduce((sum, val) => sum + (val > 0 ? parseInt(val) : 0), 0);

        if (updatedTotal <= 150) {
            setApplicationInputsState(prevInputs => ({
                ...prevInputs,
                [item]: updatedInputs
            }));
            setTotal(updatedTotal);
        }
    };

    const handleShowInputs = (item) => {
        setApplicationInputsState(prevInputs => ({
            ...prevInputs,
            [item]: Array(itemUsage[item]).fill(0)
        }));
    };

    return (
        <div className="application-time-page">
            <h1>Application Time</h1>
            <div className="application-time-list">
                {defaultItems.map((item, index) => (
                    <div key={index} className="application-time-entry">
                        <span>{item}</span>
                        <button onClick={() => handleShowInputs(item)}>+</button>
                        <div className="application-time-inputs">
                            {applicationInputs[item].length > 0 && applicationInputs[item].map((input, idx) => (
                                <input
                                    key={idx}
                                    type="number"
                                    value={input}
                                    onChange={(e) => handleChange(item, idx, e.target.value)}
                                    min="-150"
                                    max="150"
                                    step="1"
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div>Total: {total}</div>
            </div>
        </div>
    );
};

export default Application;
