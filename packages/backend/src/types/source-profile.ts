/**
 * @fileoverview Source profile schema for research sources
 * @lastmodified 2025-11-05
 *
 * Features: Unified schema for papers, videos, blogs, repos, specs
 * Main types: SourceProfile, Author, Citation, Venue
 * Constraints: Supports multiple source types with enrichment fields
 * Patterns: Discriminated union for source types
 */

/**
 * Source type discriminator
 */
export type SourceType = 'paper' | 'video' | 'blog' | 'repository' | 'specification' | 'book' | 'webpage';

/**
 * Author information
 */
export interface Author {
  name: string;
  orcid?: string;
  affiliation?: string;
  email?: string;
}

/**
 * Venue information (journal, conference, etc.)
 */
export interface Venue {
  name: string;
  type?: 'journal' | 'conference' | 'workshop' | 'preprint' | 'book' | 'other';
  issn?: string;
  isbn?: string;
  publisher?: string;
  rank?: string; // SCImago quartile: Q1, Q2, Q3, Q4
  impactFactor?: number;
}

/**
 * Citation information
 */
export interface Citation {
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number;
  venue?: string;
}

/**
 * Open Access information
 */
export interface OpenAccess {
  isOA: boolean;
  oaStatus?: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
  oaUrl?: string;
  license?: string;
}

/**
 * Retraction information
 */
export interface RetractionInfo {
  isRetracted: boolean;
  retractionDate?: string;
  retractionReason?: string;
  retractionNotice?: string;
}

/**
 * Video-specific metadata
 */
export interface VideoMetadata {
  channelId?: string;
  channelName?: string;
  duration?: number; // seconds
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishedAt?: string;
  transcript?: string;
  thumbnailUrl?: string;
}

/**
 * Repository-specific metadata
 */
export interface RepositoryMetadata {
  platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
  owner: string;
  repoName: string;
  stars?: number;
  forks?: number;
  language?: string;
  lastCommit?: string;
  readme?: string;
}

/**
 * Base source profile
 */
export interface BaseSourceProfile {
  // Identifiers
  url: string;
  doi?: string;
  arxivId?: string;
  pmid?: string; // PubMed ID

  // Core metadata
  type: SourceType;
  title: string;
  authors: Author[];
  abstract?: string;
  publishedDate?: string;
  accessedDate: string;

  // Venue information
  venue?: Venue;

  // Citations
  citationCount?: number;
  referencesCount?: number;
  citations?: Citation[]; // Who cites this
  references?: Citation[]; // What this cites

  // Quality indicators
  openAccess?: OpenAccess;
  retraction?: RetractionInfo;
  peerReviewed?: boolean;

  // Content
  fullText?: string;
  keywords?: string[];
  topics?: string[];

  // Enrichment metadata
  enrichedAt?: string;
  enrichmentSources: string[]; // Which APIs were used: ['crossref', 'openalex', 'semanticscholar']
  confidence?: number; // 0-1 confidence in the enrichment

  // Source-specific metadata
  sourceMetadata?: VideoMetadata | RepositoryMetadata | Record<string, unknown>;
}

/**
 * Paper source profile
 */
export interface PaperSourceProfile extends BaseSourceProfile {
  type: 'paper';
  venue: Venue;
  openAccess: OpenAccess;
  peerReviewed: boolean;
}

/**
 * Video source profile
 */
export interface VideoSourceProfile extends BaseSourceProfile {
  type: 'video';
  sourceMetadata: VideoMetadata;
}

/**
 * Repository source profile
 */
export interface RepositorySourceProfile extends BaseSourceProfile {
  type: 'repository';
  sourceMetadata: RepositoryMetadata;
}

/**
 * Generic source profile (for blogs, specs, etc.)
 */
export interface GenericSourceProfile extends BaseSourceProfile {
  type: 'blog' | 'specification' | 'book' | 'webpage';
}

/**
 * Discriminated union of all source profiles
 */
export type SourceProfile =
  | PaperSourceProfile
  | VideoSourceProfile
  | RepositorySourceProfile
  | GenericSourceProfile;

/**
 * Enrichment request
 */
export interface EnrichmentRequest {
  url: string;
  doi?: string;
  title?: string;
  authors?: string[];
  type?: SourceType;
  forceRefresh?: boolean;
}

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  profile: SourceProfile;
  cached: boolean;
  enrichmentDuration: number;
  errors?: Array<{ source: string; error: string }>;
}

/**
 * Type guards
 */
export function isPaperProfile(profile: SourceProfile): profile is PaperSourceProfile {
  return profile.type === 'paper';
}

export function isVideoProfile(profile: SourceProfile): profile is VideoSourceProfile {
  return profile.type === 'video';
}

export function isRepositoryProfile(profile: SourceProfile): profile is RepositorySourceProfile {
  return profile.type === 'repository';
}
