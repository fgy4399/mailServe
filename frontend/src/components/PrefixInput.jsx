import React from 'react';

function PrefixInput({ value, onChange, error, disabled }) {
    return (
        <div className="prefix-input">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱前缀 <span className="text-gray-400">(可选，留空随机生成)</span>
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.toLowerCase())}
                disabled={disabled}
                placeholder="例如: myname"
                maxLength={30}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">3-30个字符，只允许字母、数字、点、下划线、连字符</p>
        </div>
    );
}

export default PrefixInput;
