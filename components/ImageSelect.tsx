"use client";
import { useId } from 'react';
import Select, { SingleValue, ActionMeta } from 'react-select';

// 1. オプションの型定義
export interface ImageOption {
    value: string;
    label: string;
    icon: string;
}

// 2. コンポーネントのPropsの型定義
interface ImageSelectProps {
    options: ImageOption[];
    value?: ImageOption | null;
    onChange?: (newValue: SingleValue<ImageOption>, actionMeta: ActionMeta<ImageOption>) => void;
    placeholder?: string;
}

export default function ImageSelect({
    options,
    value,
    onChange,
    placeholder
}: ImageSelectProps) {
    const instanceId = useId();

    return (
        <Select<ImageOption>
            instanceId={instanceId}
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder || "選択してください..."}
            styles={{
                control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: 'inherit',
                    borderColor: 'inherit', // or use a specific color if needed
                    color: 'inherit',
                    fontSize: '0.75rem', // text-xs
                }),
                menu: (baseStyles) => ({
                    ...baseStyles,
                    // Menu needs a solid background to be readable over other content
                    backgroundColor: '#1e293b', // slate-800
                    fontSize: '0.75rem', // text-xs
                }),
                option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isFocused ? '#334155' : 'inherit', // slate-700 : inherit
                    color: state.isFocused ? '#e2e8f0' : 'inherit', // slate-200 : inherit
                    fontSize: '0.75rem', // text-xs
                    ':active': {
                        backgroundColor: '#475569', // slate-600
                    },
                }),
                singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: 'inherit',
                    fontSize: '0.75rem', // text-xs
                }),
                input: (baseStyles) => ({
                    ...baseStyles,
                    color: 'inherit',
                    fontSize: '0.75rem', // text-xs
                }),
            }}
            formatOptionLabel={(item: ImageOption) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src={item.icon}
                        alt={item.label}
                        style={{ width: 24, height: 24, marginRight: 10, borderRadius: '4px' }}
                    />
                    <span>{item.label}</span>
                </div>
            )}
        />
    );
}
