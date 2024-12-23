import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(pathname);
  const scrollPositions = useRef({});

  useEffect(() => {
    if (navigationType === "PUSH") {
      scrollPositions.current[prevPathname.current] = window.scrollY;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (navigationType === "POP") {
      const scrollY = scrollPositions.current[pathname] || 0;
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    }
    prevPathname.current = pathname;
  }, [pathname, navigationType]);

  return null;
}

export default ScrollToTop;
