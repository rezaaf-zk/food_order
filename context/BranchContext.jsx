import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { fetchBranches, FALLBACK_BRANCHES } from '../services/branchService';

export const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState(FALLBACK_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [detectedBranch, setDetectedBranch] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // prompt | granted | denied
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Load branches and restore saved preference
  useEffect(() => {
    let isMounted = true;

    async function initBranches() {
      setIsLoadingBranches(true);
      try {
        const branchList = await fetchBranches();
        if (isMounted) {
          setBranches(branchList);

          const savedBranchId = localStorage.getItem('foodorder_selected_branch_id');
          if (savedBranchId) {
            const match = branchList.find((b) => b.id === savedBranchId);
            if (match) {
              setSelectedBranch(match);
            } else {
              setSelectedBranch(branchList[0]);
            }
          } else {
            // Default to first branch if no preference
            setSelectedBranch(branchList[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setSelectedBranch(FALLBACK_BRANCHES[0]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      }
    }

    initBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  // Request geolocation and detect nearest branch (Chapter 15)
  const detectNearestBranch = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return null;
    }

    setIsDetecting(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationPermission('granted');

          try {
            const sortedBranches = await fetchBranches(lat, lng);
            setBranches(sortedBranches);

            if (sortedBranches.length > 0) {
              const nearest = sortedBranches[0];
              setDetectedBranch(nearest);

              // If user hasn't explicitly chosen a different branch, set nearest as selected
              const userOverride = localStorage.getItem('foodorder_user_manual_branch_override');
              if (!userOverride) {
                setSelectedBranch(nearest);
                localStorage.setItem('foodorder_selected_branch_id', nearest.id);
              }
              resolve(nearest);
            }
          } catch (e) {
            resolve(null);
          } finally {
            setIsDetecting(false);
          }
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error.message);
          setLocationPermission('denied');
          setIsDetecting(false);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }, []);

  const selectBranch = useCallback((branch, isManual = true) => {
    if (!branch) return;
    setSelectedBranch(branch);
    localStorage.setItem('foodorder_selected_branch_id', branch.id);
    if (isManual) {
      localStorage.setItem('foodorder_user_manual_branch_override', 'true');
    }
  }, []);

  const clearBranch = useCallback(() => {
    setSelectedBranch(null);
    localStorage.removeItem('foodorder_selected_branch_id');
    localStorage.removeItem('foodorder_user_manual_branch_override');
  }, []);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        detectedBranch,
        userLocation,
        locationPermission,
        isDetecting,
        isLoadingBranches,
        isSelectorOpen,
        openSelector: () => setIsSelectorOpen(true),
        closeSelector: () => setIsSelectorOpen(false),
        selectBranch,
        detectNearestBranch,
        clearBranch
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
