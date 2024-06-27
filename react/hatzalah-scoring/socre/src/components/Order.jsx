// import React, { useState, useEffect } from 'react';

// const Order = ({ orderConfig, setOrderConfig }) => {
//     const defaultItems = [
//         'Pulse Oximeter',
//         'Stethoscope-BP',
//         'Tourniquet',
//         'Inhaler',
//         'Epinephrine',
//         'Oxygen tank',
//         'Non-Rebreather',
//         'Stethoscope-Breathing',
//         'Supine Position With Feet Raised',
//         'Supine Position',
//         'CPAP',
//         'Insulin',
//         'Cervical Collar',
//         'IV',
//         'Nitroglycerin',
//         'Tripod Position',
//         'Triangle Bandage',
//         'Glucometer',
//         'Listen-Breathing',
//         'Package Gauze',
//         'Thermometer',
//         'Epinephrine',
//         'Aspirin',
//         'Antiseptic Wipes',
//         'Antihistamines',
//         'Cold Packs',
//         'Heat Packs',
//         'Tweezers',
//         'Scissors',
//         'Glucogel',
//         'Fowler Position',
//         'Thermal Blanket',
//         'Flashlight',
//         'Surgical Gloves'
//     ];

//     const [combinations, setCombinations] = useState([]);

//     const handleSelection = (item, value) => {
//         setOrderConfig(prevConfig => ({
//             ...prevConfig,
//             [item]: value
//         }));
//     };

//     const generatePermutations = (arr) => {
//         if (arr.length === 0) return [[]];
//         const firstElem = arr[0];
//         const rest = arr.slice(1);

//         const withoutFirst = generatePermutations(rest);
//         const withFirst = [];

//         withoutFirst.forEach(perm => {
//             for (let i = 0; i <= perm.length; i++) {
//                 const start = perm.slice(0, i);
//                 const end = perm.slice(i);
//                 const newPerm = [...start, firstElem, ...end];
//                 withFirst.push(newPerm);
//             }
//         });

//         return withFirst;
//     };

//     const generateSubsets = (arr) => {
//         const subsets = [[]];

//         arr.forEach(item => {
//             const last = subsets.length - 1;
//             for (let i = 0; i <= last; i++) {
//                 subsets.push([...subsets[i], item]);
//             }
//         });

//         return subsets.filter(subset => subset.length > 0);
//     };

//     const generateCombinations = () => {
//         const checkedItems = [];
//         const allItems = Object.keys(orderConfig);

//         allItems.forEach(item => {
//             if (orderConfig[item] === true) {
//                 checkedItems.push(item);
//             }
//         });

//         let combinations = [];

//         // Generate permutations of checked items
//         const checkedSubsets = generateSubsets(checkedItems).reverse(); // Get subsets and reverse to start with the largest
//         checkedSubsets.forEach(subset => {
//             const permutations = generatePermutations(subset);
//             permutations.forEach(perm => combinations.push({ items: perm, score: 0 }));
//         });

//         // Remove duplicates
//         const uniqueCombinations = [];
//         const seen = new Set();

//         combinations.forEach(combo => {
//             const comboString = combo.items.join(',');
//             if (!seen.has(comboString)) {
//                 seen.add(comboString);
//                 uniqueCombinations.push(combo);
//             }
//         });

//         // Sort combinations by length, then alphabetically
//         uniqueCombinations.sort((a, b) => {
//             if (b.items.length !== a.items.length) {
//                 return b.items.length - a.items.length;
//             }
//             return a.items.join(',').localeCompare(b.items.join(','));
//         });

//         setCombinations(uniqueCombinations);
//     };

//     const handleScoreChange = (index, value) => {
//         const newCombinations = [...combinations];
//         newCombinations[index].score = Math.min(Math.max(parseInt(value) || 0, 0), 100);
//         setCombinations(newCombinations);
//         // Save combinations to local storage
//         localStorage.setItem('orderConfig', JSON.stringify(newCombinations));
//     };

//     return (
//         <div className="order-page">
//             <h1>Order</h1>
//             <div className="order-list">
//                 {defaultItems.map((item, index) => (
//                     <div key={index} className="order-entry">
//                         <span>{item}</span>
//                         <button onClick={() => handleSelection(item, true)}>&#x2714;</button>
//                         <button onClick={() => handleSelection(item, false)}>&#x2716;</button>
//                     </div>
//                 ))}
//             </div>
//             <button onClick={generateCombinations} className="generate-button">Generate Combinations</button>
//             <div className="combinations-list">
//                 {combinations.map((combo, index) => (
//                     <div key={index} className="combination-entry">
//                         <span>{combo.items.join(', ')}</span>
//                         <input
//                             type="number"
//                             value={combo.score}
//                             onChange={(e) => handleScoreChange(index, e.target.value)}
//                             min="0"
//                             max="100"
//                         />
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default Order;


import React, { useState } from 'react';

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

    const handleSelection = (item, value) => {
        setOrderConfig(prevConfig => ({
            ...prevConfig,
            [item]: value
        }));
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

        // Generate permutations of checked items
        const checkedSubsets = generateSubsets(checkedItems).reverse(); // Get subsets and reverse to start with the largest
        checkedSubsets.forEach(subset => {
            const permutations = generatePermutations(subset);
            permutations.forEach(perm => combinations.push({ items: perm, score: 0 }));
        });

        // Remove duplicates
        const uniqueCombinations = [];
        const seen = new Set();

        combinations.forEach(combo => {
            const comboString = combo.items.join(',');
            if (!seen.has(comboString)) {
                seen.add(comboString);
                uniqueCombinations.push(combo);
            }
        });

        // Sort combinations by length, then alphabetically
        uniqueCombinations.sort((a, b) => {
            if (b.items.length !== a.items.length) {
                return b.items.length - a.items.length;
            }
            return a.items.join(',').localeCompare(b.items.join(','));
        });

        setCombinations(uniqueCombinations);
        setOrderConfig(uniqueCombinations); // Save combinations in orderConfig
    };

    const handleScoreChange = (index, value) => {
        const newCombinations = [...combinations];
        newCombinations[index].score = Math.min(Math.max(parseInt(value) || 0, 0), 100);
        setCombinations(newCombinations);
        setOrderConfig(newCombinations); // Update orderConfig with new scores
    };

    return (
        <div className="order-page">
            <h1>Order</h1>
            <div className="order-list">
                {defaultItems.map((item, index) => (
                    <div key={index} className="order-entry">
                        <span>{item}</span>
                        <button onClick={() => handleSelection(item, true)}>&#x2714;</button>
                        <button onClick={() => handleSelection(item, false)}>&#x2716;</button>
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

