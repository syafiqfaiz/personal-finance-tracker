import {
    ShoppingBag,
    Car,
    Home,
    Utensils,
    Plane,
    Gamepad2,
    Zap,
    HeartPulse,
    GraduationCap,
    Gift,
    Smartphone,
    Wifi,
    Droplets,
    Briefcase,
    Music,
    Film,
    Coffee,
    Shirt,
    Hammer,
    PawPrint,
    Tag,
    Wallet
} from 'lucide-react';
import React from 'react';

export const AVAILABLE_ICONS = [
    { name: 'ShoppingBag', component: ShoppingBag, label: 'Shopping' },
    { name: 'Utensils', component: Utensils, label: 'Food' },
    { name: 'Car', component: Car, label: 'Transport' },
    { name: 'Home', component: Home, label: 'Housing' },
    { name: 'Zap', component: Zap, label: 'Utilities' },
    { name: 'Wifi', component: Wifi, label: 'Internet' },
    { name: 'Smartphone', component: Smartphone, label: 'Phone' },
    { name: 'HeartPulse', component: HeartPulse, label: 'Health' },
    { name: 'GraduationCap', component: GraduationCap, label: 'Education' },
    { name: 'Briefcase', component: Briefcase, label: 'Work' },
    { name: 'Plane', component: Plane, label: 'Travel' },
    { name: 'Gamepad2', component: Gamepad2, label: 'Entertainment' },
    { name: 'Music', component: Music, label: 'Music' },
    { name: 'Film', component: Film, label: 'Movies' },
    { name: 'Coffee', component: Coffee, label: 'Cafe' },
    { name: 'Shirt', component: Shirt, label: 'Clothing' },
    { name: 'Hammer', component: Hammer, label: 'Repairs' },
    { name: 'PawPrint', component: PawPrint, label: 'Pets' },
    { name: 'Gift', component: Gift, label: 'Gifts' },
    { name: 'Wallet', component: Wallet, label: 'General' },
];

export const DEFAULT_ICON = 'Tag';

export const getIconComponent = (name: string, props: React.SVGProps<SVGSVGElement> = {}) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === name);
    const IconComponent = icon ? icon.component : Tag;
    return <IconComponent {...props} />;
};
