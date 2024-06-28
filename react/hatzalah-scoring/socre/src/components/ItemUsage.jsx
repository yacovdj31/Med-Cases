import React, { useState, useEffect } from 'react';

const ItemUsage = ({ setItemUsage }) => {
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

    const [localItemUsage, setLocalItemUsage] = useState(
        defaultItems.reduce((acc, item) => ({ ...acc, [item]: 1 }), {})
    );

    useEffect(() => {
        setItemUsage(localItemUsage);
    }, [localItemUsage, setItemUsage]);

    const handleChange = (item, value) => {
        if (value >= 0 && value <= 5) {
            const newItemUsage = { ...localItemUsage, [item]: value };
            setLocalItemUsage(newItemUsage);
        }
    };

    return (
        <div className="item-usage-page">
            <h1>Item Usage</h1>
            <div className="item-usage-list">
                {defaultItems.map((item, index) => (
                    <div key={index} className="item-usage-entry">
                        <span>{item}</span>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={localItemUsage[item]}
                            onChange={(e) => handleChange(item, parseInt(e.target.value))}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ItemUsage;
