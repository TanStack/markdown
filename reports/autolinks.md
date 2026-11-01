# Optional HTTP(S) autolinks

Existing PR #20 by Silouan Wright, refreshed privately on main `d9b5ef7133ba514f7269cd8f29b5719cd34f5836`. The extension stays opt-in and adds no runtime dependency or default parser behavior.

The corrected extension measures 965 minified bytes, 631 gzip bytes at level 9, and 556 Brotli bytes with Node 24.15.0 and the locked esbuild version. Every existing public-entry budget and the draft extension ceiling remain unchanged.

The boundary check now reads the preceding Unicode code point, including letters and numbers represented by surrogate pairs. Protocol recognition only needs a boolean match. Malformed candidates and valid labels share one text-node allocation, preserving literal malformed input and application URL policy behavior.

All 334 tests pass, including 48 extension cases and HTML/React/Octane parity. Types, build, documentation checks and existing size gates pass. Core CommonMark matches remain unchanged because core runtime source is unchanged.

The earlier draft also passed full verify, the external corpus audit and Chromium streaming checks before this Unicode correction. Those receipts are not fresh performance or memory acceptance for the corrected source. Actual React DOM checks now pass in Chromium, Firefox and WebKit for Unicode letter/number boundaries and emoji links, preserving labels. New matched performance and memory checks, packed-consumer validation, and exact-head CI are still required before promotion. No merge or release is claimed.
