import ReactGA from 'react-ga4';

export const AnalyticsService = {
    init: () => {
        if (!import.meta.env.PROD) {
            console.log('Analytics disabled in development');
            return;
        }

        const gaId = import.meta.env.VITE_GA_ID;
        if (gaId) {
            ReactGA.initialize(gaId);
        }
    },

    logPageView: (path: string) => {
        if (!import.meta.env.PROD || !import.meta.env.VITE_GA_ID) return;
        ReactGA.send({ hitType: "pageview", page: path });
    },

    logEvent: (category: string, action: string, label?: string) => {
        if (!import.meta.env.PROD || !import.meta.env.VITE_GA_ID) return;
        ReactGA.event({
            category,
            action,
            label
        });
    }
};
