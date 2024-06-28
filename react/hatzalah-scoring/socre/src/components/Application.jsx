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
        let newValue = value === '' ? '' : Math.max(parseInt(value) || 0, -150);
        const currentTotal = Object.values(applicationInputs)
            .flat()
            .reduce((sum, val) => sum + (val > 0 ? parseInt(val) : 0), 0);

        const remaining = 150 - currentTotal + (applicationInputs[item][index] > 0 ? parseInt(applicationInputs[item][index]) : 0);

        if (newValue > remaining) {
            newValue = remaining;
        }

        const updatedInputs = applicationInputs[item].map((input, idx) => (idx === index ? newValue : input));
        const updatedTotal = Object.values(updatedInputs).reduce((sum, val) => sum + (val > 0 ? parseInt(val) : 0), 0);

        if (updatedTotal <= 150 || newValue < applicationInputs[item][index] || value === '') {
            setApplicationInputsState(prevInputs => ({
                ...prevInputs,
                [item]: updatedInputs
            }));
            setTotal(currentTotal - (applicationInputs[item][index] > 0 ? parseInt(applicationInputs[item][index]) : 0) + newValue);
        }
    };

    const handleFocus = (item, index) => {
        if (applicationInputs[item][index] === 0) {
            const updatedInputs = applicationInputs[item].map((input, idx) => (idx === index ? '' : input));
            setApplicationInputsState(prevInputs => ({
                ...prevInputs,
                [item]: updatedInputs
            }));
        }
    };

    const handleBlur = (item, index) => {
        if (applicationInputs[item][index] === '') {
            const updatedInputs = applicationInputs[item].map((input, idx) => (idx === index ? 0 : input));
            setApplicationInputsState(prevInputs => ({
                ...prevInputs,
                [item]: updatedInputs
            }));
        }
    };

    return (
        <div className="application-time-page">
            <h1>Application Time</h1>
            <div className="application-time-list">
                {defaultItems.map((item, index) => (
                    applicationInputs[item].length > 0 && (
                        <div key={index} className="application-time-entry">
                            <span>{item}</span>
                            <div className="application-time-inputs">
                                {applicationInputs[item].map((input, idx) => (
                                    <input
                                        key={idx}
                                        type="number"
                                        value={input}
                                        onChange={(e) => handleChange(item, idx, e.target.value)}
                                        onFocus={() => handleFocus(item, idx)}
                                        onBlur={() => handleBlur(item, idx)}
                                        min="-150"
                                        max="150"
                                        step="1"
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
                <div>Total: {total}</div>
            </div>
        </div>
    );
};

export default Application;
