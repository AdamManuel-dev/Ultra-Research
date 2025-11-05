/**
 * @fileoverview Typed useSelector hook
 * @lastmodified 2025-11-05
 */

import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useAppSelector = useSelector.withTypes<RootState>();
