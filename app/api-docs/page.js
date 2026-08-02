"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";
import "./swagger-dark.css";

// Uses swagger-ui-dist's vanilla JS bundle (SwaggerUIBundle) instead of swagger-ui-react.
// swagger-ui-react wraps old class components (e.g. ParameterRow) that still use the
// deprecated UNSAFE_componentWillReceiveProps lifecycle, which React's StrictMode (on by
// default in Next.js dev) flags as a big red dev-overlay error. It's harmless and
// production-only-invisible, but mounting the vanilla bundle imperatively (outside React's
// component tree) avoids the warning entirely instead of just living with it.
export default function ApiDocsPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    let observer;

    import("swagger-ui-dist").then(({ SwaggerUIBundle }) => {
      if (destroyed || !containerRef.current) return;
      SwaggerUIBundle({
        url: "/api/api-docs",
        domNode: containerRef.current,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        docExpansion: "none",
      });

      // Swagger UI lets every tag section AND every endpoint's ".opblock" inside it
      // expand independently. Force an accordion at both levels instead: whenever one
      // gains "is-open", close whichever sibling was open before by clicking its own
      // toggle (Swagger UI's own handler), rather than reaching into its Redux internals.
      const ACCORDION_LEVELS = [
        { itemClass: "opblock-tag-section", toggleSelector: ".opblock-tag" },
        { itemClass: "opblock", toggleSelector: ".opblock-summary-control" },
      ];

      observer = new MutationObserver((mutations) => {
        for (const { target, oldValue } of mutations) {
          const level = ACCORDION_LEVELS.find((l) =>
            target.classList?.contains(l.itemClass)
          );
          if (!level) continue;

          const wasOpen = oldValue?.split(" ").includes("is-open");
          const isOpen = target.classList.contains("is-open");
          if (!isOpen || wasOpen) continue;

          containerRef.current
            .querySelectorAll(`.${level.itemClass}.is-open`)
            .forEach((item) => {
              if (item !== target) {
                item.querySelector(level.toggleSelector)?.click();
              }
            });
        }
      });

      observer.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ["class"],
        attributeOldValue: true,
        subtree: true,
      });
    });

    return () => {
      destroyed = true;
      observer?.disconnect();
    };
  }, []);

  return <div ref={containerRef} />;
}
