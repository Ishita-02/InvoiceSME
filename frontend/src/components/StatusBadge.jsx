'use client';

const StatusBadge = ({ status }) => {
    let colorClasses = '';
    let text = status;

    switch (status) {
        case 'Pending':
            colorClasses = 'bg-gray-100 text-gray-800';
            break;
        case 'ManualReview':
            colorClasses = 'bg-amber-100 text-amber-800';
            text = 'In Review';
            break;
        case 'Listed':
            colorClasses = 'bg-green-100 text-green-800';
            break;
        case 'Funded':
            colorClasses = 'bg-blue-100 text-blue-800';
            break;
        case 'Repaid':
            colorClasses = 'bg-indigo-100 text-indigo-800';
            break;
        case 'Closed':
            colorClasses = 'bg-slate-100 text-slate-800';
            break;
        default:
            colorClasses = 'bg-gray-100 text-gray-800';
    }

    return (
        <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${colorClasses}`}
        >
            {text}
        </span>
    );
};

export default StatusBadge;

