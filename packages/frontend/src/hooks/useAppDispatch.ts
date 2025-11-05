/**
 * @fileoverview Typed useDispatch hook
 * @lastmodified 2025-11-05
 */

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
