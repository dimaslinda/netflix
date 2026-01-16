export interface ArchivePublicDomainItem {
    identifier: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
}

export interface ArchivePublicDomainResponse {
    page: number;
    rows: number;
    items: ArchivePublicDomainItem[];
}

export interface ArchiveMetadataFile {
    name?: string;
    format?: string;
    source?: string;
}

export interface ArchiveMetadataResponse {
    metadata?: Record<string, unknown> | null;
    files?: ArchiveMetadataFile[];
}
