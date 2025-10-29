

import React, { useState, useEffect } from 'react';

const Order = ({ orderConfig, setOrderConfig }) => {
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

    const [combinations, setCombinations] = useState([]);
    const [checkedCount, setCheckedCount] = useState(0);

    const handleSelection = (item, value) => {
        if (value && checkedCount >= 5 && orderConfig[item] !== true) return; // Limit to 5 items

        setOrderConfig(prevConfig => {
            const newState = prevConfig[item] === value ? null : value;
            if (newState === true) setCheckedCount(prevCount => prevCount + 1);
            if (prevConfig[item] === true) setCheckedCount(prevCount => prevCount - 1);
            return {
                ...prevConfig,
                [item]: newState
            };
        });
    };

    const generatePermutations = (arr) => {
        if (arr.length === 0) return [[]];
        const firstElem = arr[0];
        const rest = arr.slice(1);

        const withoutFirst = generatePermutations(rest);
        const withFirst = [];

        withoutFirst.forEach(perm => {
            for (let i = 0; i <= perm.length; i++) {
                const start = perm.slice(0, i);
                const end = perm.slice(i);
                const newPerm = [...start, firstElem, ...end];
                withFirst.push(newPerm);
            }
        });

        return withFirst;
    };

    const generateSubsets = (arr) => {
        const subsets = [[]];

        arr.forEach(item => {
            const last = subsets.length - 1;
            for (let i = 0; i <= last; i++) {
                subsets.push([...subsets[i], item]);
            }
        });

        return subsets.filter(subset => subset.length > 0);
    };

    const generateCombinations = () => {
        const checkedItems = [];
        const allItems = Object.keys(orderConfig);

        allItems.forEach(item => {
            if (orderConfig[item] === true) {
                checkedItems.push(item);
            }
        });

        let combinations = [];

        const checkedSubsets = generateSubsets(checkedItems).reverse(); // Get subsets and reverse to start with the largest
        checkedSubsets.forEach(subset => {
            const permutations = generatePermutations(subset);
            permutations.forEach(perm => combinations.push({ items: perm, score: 0 }));
        });

        const uniqueCombinations = [];
        const seen = new Set();

        combinations.forEach(combo => {
            const comboString = combo.items.join(',');
            if (!seen.has(comboString)) {
                seen.add(comboString);
                uniqueCombinations.push(combo);
            }
        });

        uniqueCombinations.sort((a, b) => {
            if (b.items.length !== a.items.length) {
                return b.items.length - a.items.length;
            }
            return a.items.join(',').localeCompare(b.items.join(','));
        });

        setCombinations(uniqueCombinations);
        setOrderConfig(prevConfig => ({
            ...prevConfig,
            possibleOrders: uniqueCombinations,
            correctItems: checkedItems,
            affectItems: allItems.filter(item => orderConfig[item] === false)
        }));
    };

    const handleScoreChange = (index, value) => {
        const newCombinations = [...combinations];
        newCombinations[index].score = Math.min(Math.max(parseInt(value) || 0, 0), 100);
        setCombinations(newCombinations);
        setOrderConfig(prevConfig => ({
            ...prevConfig,
            possibleOrders: newCombinations
        }));
    };

    const handleFocus = (index) => {
        const newCombinations = [...combinations];
        if (newCombinations[index].score === 0) {
            newCombinations[index].score = '';
        }
        setCombinations(newCombinations);
    };

    const handleBlur = (index) => {
        const newCombinations = [...combinations];
        if (newCombinations[index].score === '') {
            newCombinations[index].score = 0;
        }
        setCombinations(newCombinations);
    };

    return (
        <div className="order-page">
            <h1>Order</h1>
            <div className="order-list">
                {defaultItems.map((item, index) => (
                    <div key={index} className={`order-entry ${orderConfig[item] === true ? 'selected' : orderConfig[item] === false ? 'deselected' : ''}`}>
                        <span>{item}</span>
                        <div className="button-group">
                            <button onClick={() => handleSelection(item, true)}>&#x2714;</button>
                            <button onClick={() => handleSelection(item, false)}>&#x2716;</button>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={generateCombinations} className="generate-button">Generate Combinations</button>
            <div className="combinations-list">
                {combinations.map((combo, index) => (
                    <div key={index} className="combination-entry">
                        <span>{combo.items.join(', ')}</span>
                        <input
                            type="number"
                            value={combo.score}
                            onChange={(e) => handleScoreChange(index, e.target.value)}
                            onFocus={() => handleFocus(index)}
                            onBlur={() => handleBlur(index)}
                            min="0"
                            max="100"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Order;
