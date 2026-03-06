export type Section = {
    email?: string;
    heading: string;
    content?: string;
    list?: string[];
};

export type LegalPageProps = {
    title: string;
    lastUpdated: string;
    sections: Section[];
};