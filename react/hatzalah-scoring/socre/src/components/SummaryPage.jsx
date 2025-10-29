// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// const SummaryPage = () => {
//     const navigate = useNavigate();
//     const summaryData = JSON.parse(localStorage.getItem('summaryData')) || {};
//     const questions = JSON.parse(localStorage.getItem('questions')) || {};
//     const itemUsage = JSON.parse(localStorage.getItem('itemUsage')) || {};
//     const applicationInputs = JSON.parse(localStorage.getItem('applicationInputs')) || {};
//     const orderConfig = JSON.parse(localStorage.getItem('orderConfig')) || [];
//     const vitalsCheck = JSON.parse(localStorage.getItem('vitalsCheck')) || {};
//     const scoringData = JSON.parse(localStorage.getItem('scoringData')) || {};
//     const newScoringData = JSON.parse(localStorage.getItem('newScoringData')) || {};

//     const saveCase = () => {
//         const cases = JSON.parse(localStorage.getItem('cases')) || [];
//         cases.push(summaryData);
//         localStorage.setItem('cases', JSON.stringify(cases));
//         navigate('/');
//     };

//     const filteredApplicationInputs = Object.fromEntries(
//         Object.entries(applicationInputs).filter(([key, values]) => values.length > 1 || values.some(value => value !== 0))
//     );

//     const formatApplicationInputs = (inputs) => {
//         let itemString = '';
//         Object.entries(inputs).forEach(([itemName, values]) => {
//             const nonZeroValues = values.filter(value => value !== 0);
//             if (values.length > 1 || nonZeroValues.length > 0) {
//                 itemString += `if (itemName === "${itemName}") {\n`;
//                 values.forEach((value, idx) => {
//                     itemString += `  if (itemClickCount[itemName] === ${idx + 1}) adjustment = ${value};\n`;
//                 });
//                 itemString += `}\n`;
//             }
//         });
//         return itemString.trim();
//     };

//     const formattedApplicationInputs = formatApplicationInputs(filteredApplicationInputs);

//     const formatOrderConfig = (orderConfig) => {
//         let orderString = `possibleOrders: [\n`;
//         if (Array.isArray(orderConfig.possibleOrders)) {
//             orderConfig.possibleOrders.forEach(order => {
//                 orderString += `  { order: [${order.items.map(item => `"${item}"`).join(', ')}], score: ${order.score} },\n`;
//             });
//         }
//         orderString += '],\n';
//         orderString += `correctItems: [${orderConfig.correctItems ? orderConfig.correctItems.map(item => `"${item}"`).join(', ') : ''}],\n`;
//         orderString += `negativeItems: [${orderConfig.affectItems ? orderConfig.affectItems.map(item => `"${item}"}`).join(', ') : ''}],\n`;
//         return orderString.trim();
//     };

//     const formattedOrderConfig = formatOrderConfig(orderConfig);

//     const formatScoringData = (scoringData) => {
//         let scoringString = '';
//         if (scoringData) {
//             scoringString += `healthScoringWeights: { applicationScore: ${(newScoringData.correctApplication / 100).toFixed(2)}, orderScore: ${(newScoringData.correctApplicationOrder / 100).toFixed(2)} },\n`;
//             scoringString += `finalScoringWeights: { \n`;
//             scoringString += `  conversationScore: ${(scoringData.conversation / 100).toFixed(2)},\n`;
//             scoringString += `  applicationScore: ${(scoringData.correctApplication / 100).toFixed(2)},\n`;
//             scoringString += `  orderScore: ${(scoringData.correctApplicationOrder / 100).toFixed(2)},\n`;
//             scoringString += `  vitalCheckScore: ${(scoringData.correctVitalCheck / 100).toFixed(2)},\n`;
//             scoringString += `  diagnosesScore: ${(scoringData.correctDiagnosis / 100).toFixed(2)},\n`;
//             scoringString += `  orderCombinationScore: ${(scoringData.correctOrderOfAllProcesses / 100).toFixed(2)}\n`;
//             scoringString += `}`;
//         }
//         return scoringString.trim();
//     };

//     const formatNewScoringData = (newScoringData) => {
//         let newScoringString = '';
//         Object.entries(newScoringData).forEach(([category, score]) => {
//             newScoringString += `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${(score / 100).toFixed(2)}\n`;
//         });
//         return newScoringString.trim();
//     };

//     const formattedScoringData = formatScoringData(scoringData);
//     const formattedNewScoringData = formatNewScoringData(newScoringData);

//     const formatVitals = (vitals) => {
//         return `
// BPM: ${vitals.BPM || 'N/A'}
// Oxygen: ${vitals.Oxygen || 'N/A'}
// Glucose: ${vitals.Glucose || 'N/A'}
// BreathingRate: ${vitals.BreathingRate || 'N/A'}
// BP: [${vitals.BP1 || 'N/A'}, ${vitals.BP2 || 'N/A'}]`;
//     };

//     const formattedInitialVitals = formatVitals(summaryData.initialVitals || {});
//     const formattedPerfectVitals = formatVitals(summaryData.perfectVitals || {});
//     const formattedWorseVitals = formatVitals(summaryData.worseVitals || {});

//     const formattedSummary = `
// {
//   id: ${summaryData.id},
//   character: ${summaryData.character},
//   dispatchCall: "${summaryData.dispatchCall}",
//   diagnosis: "${summaryData.diagnosis}",
//   category: "${summaryData.category}",
//   initialHealthLevel: ${summaryData.initialHealthLevel},
//   maxHealthLevel: ${summaryData.maxHealthLevel},
//   vitals: {
//     initialVitals: {
//       BPM: ${summaryData.initialVitals?.BPM || 'N/A'},
//       Oxygen: ${summaryData.initialVitals?.Oxygen || 'N/A'},
//       Glucose: ${summaryData.initialVitals?.Glucose || 'N/A'},
//       BreathingRate: ${summaryData.initialVitals?.BreathingRate || 'N/A'},
//       BP: [${summaryData.initialVitals?.BP1 || 'N/A'}, ${summaryData.initialVitals?.BP2 || 'N/A'}],
//     },
//     perfectVitals: {
//       BPM: ${summaryData.perfectVitals?.BPM || 'N/A'},
//       Oxygen: ${summaryData.perfectVitals?.Oxygen || 'N/A'},
//       Glucose: ${summaryData.perfectVitals?.Glucose || 'N/A'},
//       BreathingRate: ${summaryData.perfectVitals?.BreathingRate || 'N/A'},
//       BP: [${summaryData.perfectVitals?.BP1 || 'N/A'}, ${summaryData.perfectVitals?.BP2 || 'N/A'}],
//     },
//     worseVitals: {
//       BPM: ${summaryData.worseVitals?.BPM || 'N/A'},
//       Oxygen: ${summaryData.worseVitals?.Oxygen || 'N/A'},
//       Glucose: ${summaryData.worseVitals?.Glucose || 'N/A'},
//       BreathingRate: ${summaryData.worseVitals?.BreathingRate || 'N/A'},
//       BP: [${summaryData.worseVitals?.BP1 || 'N/A'}, ${summaryData.worseVitals?.BP2 || 'N/A'}],
//     },
//   },
//   itemLimits: ${JSON.stringify(itemUsage, null, 2)},
//   ${formattedOrderConfig},
//   gradeToolApplication(itemName, itemClickCount) {
//     ${formattedApplicationInputs}
//   },
//   vitalCheck: {
//     "Oxygen": ${vitalsCheck.Oxygen === "once" ? 1 : vitalsCheck.Oxygen === "twice" ? 2 : vitalsCheck.Oxygen},
//     "BPM": ${vitalsCheck.BPM === "once" ? 1 : vitalsCheck.BPM === "twice" ? 2 : vitalsCheck.BPM},
//     "BP": ${vitalsCheck.BP === "once" ? 1 : vitalsCheck.BP === "twice" ? 2 : vitalsCheck.BP},
//     "BreathingRate": ${vitalsCheck.BreathingRate === "once" ? 1 : vitalsCheck.BreathingRate === "twice" ? 2 : vitalsCheck.BreathingRate},
//     "Glucose": ${vitalsCheck.Glucose === "once" ? 1 : vitalsCheck.Glucose === "twice" ? 2 : vitalsCheck.Glucose}
//   },
//   scoringRules: {
//     ${formattedScoringData}
//   },
// `;

//     return (
//         <div className="summary-page">
//             <h1>Summary</h1>
//             <div className="summary-content">
//                 <div className="section-box">
//                     <h3>Case Information</h3>
//                     <pre>{formattedSummary}</pre>
//                 </div>
//                 <div className="section-box">
//                     <h3>Conversation / Chatbot</h3>
//                     <pre>{JSON.stringify(questions, null, 2)}</pre>
//                 </div>
//                 <button onClick={saveCase}>Save Case</button>
//             </div>
//         </div>
//     );
// };

// export default SummaryPage;




import React from 'react';
import { useNavigate } from 'react-router-dom';

const SummaryPage = () => {
    const navigate = useNavigate();
    const summaryData = JSON.parse(localStorage.getItem('summaryData')) || {};
    const questions = JSON.parse(localStorage.getItem('questions')) || {};
    const itemUsage = JSON.parse(localStorage.getItem('itemUsage')) || {};
    const applicationInputs = JSON.parse(localStorage.getItem('applicationInputs')) || {};
    const orderConfig = JSON.parse(localStorage.getItem('orderConfig')) || [];
    const vitalsCheck = JSON.parse(localStorage.getItem('vitalsCheck')) || {};
    const scoringData = JSON.parse(localStorage.getItem('scoringData')) || {};
    const newScoringData = JSON.parse(localStorage.getItem('newScoringData')) || {};

    const saveCase = () => {
        const cases = JSON.parse(localStorage.getItem('cases')) || [];
        cases.push(summaryData);
        localStorage.setItem('cases', JSON.stringify(cases));
        navigate('/');
    };

    const formatApplicationInputs = (inputs) => {
        let itemString = '';
        Object.entries(inputs).forEach(([itemName, values]) => {
            const nonZeroValues = values.filter(value => value !== 0);
            if (values.length > 1 || nonZeroValues.length > 0) {
                itemString += `"${itemName}": { `;
                values.forEach((value, idx) => {
                    if (value !== 0) {
                        itemString += `${idx + 1}: ${value}, `;
                    }
                });
                itemString = itemString.slice(0, -2); // Remove trailing comma and space
                itemString += ` },\n`;
            }
        });
        return itemString.trim();
    };

    const formattedApplicationInputs = formatApplicationInputs(applicationInputs);

    const formatOrderConfig = (orderConfig) => {
        let orderString = `possibleOrders: [\n`;
        if (Array.isArray(orderConfig.possibleOrders)) {
            orderConfig.possibleOrders.forEach(order => {
                orderString += `  { order: [${order.items.map(item => `"${item}"`).join(', ')}], score: ${order.score} },\n`;
            });
        }
        orderString += '],\n';
        orderString += `correctItems: [${orderConfig.correctItems ? orderConfig.correctItems.map(item => `"${item}"`).join(', ') : ''}],\n`;
        orderString += `negativeItems: [${orderConfig.affectItems ? orderConfig.affectItems.map(item => `"${item}"}`).join(', ') : ''}],\n`;
        return orderString.trim();
    };

    const formattedOrderConfig = formatOrderConfig(orderConfig);

    const formatScoringData = (scoringData) => {
        let scoringString = '';
        if (scoringData) {
            scoringString += `finalScoringWeights: { \n`;
            scoringString += `  conversationScore: ${(scoringData.conversation / 100).toFixed(2)},\n`;
            scoringString += `  applicationScore: ${(scoringData.correctApplication / 100).toFixed(2)},\n`;
            scoringString += `  orderScore: ${(scoringData.correctApplicationOrder / 100).toFixed(2)},\n`;
            scoringString += `  vitalCheckScore: ${(scoringData.correctVitalCheck / 100).toFixed(2)},\n`;
            scoringString += `  diagnosesScore: ${(scoringData.correctDiagnosis / 100).toFixed(2)},\n`;
            scoringString += `  orderCombinationScore: ${(scoringData.correctOrderOfAllProcesses / 100).toFixed(2)}\n`;
            scoringString += `healthScoringWeights: { applicationScore: ${(newScoringData.correctApplication / 100).toFixed(2)}, orderScore: ${(newScoringData.correctApplicationOrder / 100).toFixed(2)} },\n`;
            scoringString += `}`;
        }
        return scoringString.trim();
    };

    const formatNewScoringData = (newScoringData) => {
        let newScoringString = '';
        Object.entries(newScoringData).forEach(([category, score]) => {
            newScoringString += `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${(score / 100).toFixed(2)}\n`;
        });
        return newScoringString.trim();
    };

    const formattedScoringData = formatScoringData(scoringData);
    const formattedNewScoringData = formatNewScoringData(newScoringData);

    const formatVitals = (vitals) => {
        return `
BPM: ${vitals.BPM || 'N/A'}
Oxygen: ${vitals.Oxygen || 'N/A'}
Glucose: ${vitals.Glucose || 'N/A'}
BreathingRate: ${vitals.BreathingRate || 'N/A'}
BP: [${vitals.BP1 || 'N/A'}, ${vitals.BP2 || 'N/A'}]`;
    };

    const formattedInitialVitals = formatVitals(summaryData.initialVitals || {});
    const formattedPerfectVitals = formatVitals(summaryData.perfectVitals || {});
    const formattedWorseVitals = formatVitals(summaryData.worseVitals || {});

    const formattedSummary = `
{
  id: ${summaryData.id},
  character: ${summaryData.character},
  dispatchCall: "${summaryData.dispatchCall}",
  diagnosis: "${summaryData.diagnosis}",
  category: "${summaryData.category}",
  initialHealthLevel: ${summaryData.initialHealthLevel},
  maxHealthLevel: ${summaryData.maxHealthLevel},
  vitals: {
    initialVitals: {
      BPM: ${summaryData.initialVitals?.BPM || 'N/A'},
      Oxygen: ${summaryData.initialVitals?.Oxygen || 'N/A'},
      Glucose: ${summaryData.initialVitals?.Glucose || 'N/A'},
      BreathingRate: ${summaryData.initialVitals?.BreathingRate || 'N/A'},
      BP: [${summaryData.initialVitals?.BP1 || 'N/A'}, ${summaryData.initialVitals?.BP2 || 'N/A'}],
    },
    perfectVitals: {
      BPM: ${summaryData.perfectVitals?.BPM || 'N/A'},
      Oxygen: ${summaryData.perfectVitals?.Oxygen || 'N/A'},
      Glucose: ${summaryData.perfectVitals?.Glucose || 'N/A'},
      BreathingRate: ${summaryData.perfectVitals?.BreathingRate || 'N/A'},
      BP: [${summaryData.perfectVitals?.BP1 || 'N/A'}, ${summaryData.perfectVitals?.BP2 || 'N/A'}],
    },
    worseVitals: {
      BPM: ${summaryData.worseVitals?.BPM || 'N/A'},
      Oxygen: ${summaryData.worseVitals?.Oxygen || 'N/A'},
      Glucose: ${summaryData.worseVitals?.Glucose || 'N/A'},
      BreathingRate: ${summaryData.worseVitals?.BreathingRate || 'N/A'},
      BP: [${summaryData.worseVitals?.BP1 || 'N/A'}, ${summaryData.worseVitals?.BP2 || 'N/A'}],
    },
  },
  itemLimits: ${JSON.stringify(itemUsage, null, 2)},
  ${formattedOrderConfig},
  gradeToolApplication: {
    ${formattedApplicationInputs}
  },
  vitalCheck: {
    "Oxygen": ${vitalsCheck.Oxygen === "once" ? 1 : vitalsCheck.Oxygen === "twice" ? 2 : vitalsCheck.Oxygen},
    "BPM": ${vitalsCheck.BPM === "once" ? 1 : vitalsCheck.BPM === "twice" ? 2 : vitalsCheck.BPM},
    "BP": ${vitalsCheck.BP === "once" ? 1 : vitalsCheck.BP === "twice" ? 2 : vitalsCheck.BP},
    "BreathingRate": ${vitalsCheck.BreathingRate === "once" ? 1 : vitalsCheck.BreathingRate === "twice" ? 2 : vitalsCheck.BreathingRate},
    "Glucose": ${vitalsCheck.Glucose === "once" ? 1 : vitalsCheck.Glucose === "twice" ? 2 : vitalsCheck.Glucose}
  },
  scoringRules: {
    ${formattedScoringData}
  },
`;

    return (
        <div className="summary-page">
            <h1>Summary</h1>
            <div className="summary-content">
                <div className="section-box">
                    <h3>Case Information</h3>
                    <pre>{formattedSummary}</pre>
                </div>
                <div className="section-box">
                    <h3>Conversation / Chatbot</h3>
                    <pre>{JSON.stringify(questions, null, 2)}</pre>
                </div>
                <button onClick={saveCase}>Save Case</button>
            </div>
        </div>
    );
};

export default SummaryPage;
