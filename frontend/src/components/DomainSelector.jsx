import React from 'react';

function DomainSelector({ domains, selectedDomain, onChange, disabled }) {
    return (
        <div className="domain-selector">
            <label className="block text-sm font-medium text-gray-700 mb-1">选择域名</label>
            <select
                value={selectedDomain}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                {domains.map(domain => (
                    <option key={domain} value={domain}>@{domain}</option>
                ))}
            </select>
        </div>
    );
}

export default DomainSelector;
