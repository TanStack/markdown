# Optional HTTP(S) autolinks

Based on Silouan Wright's PR #20 and composed with released Markdown 1.0.1. The extension stays opt-in, adds no runtime dependency, and leaves existing parser and renderer source unchanged.

The standalone entry passes the original draft ceiling of 994 minified bytes, 632 gzip bytes and 568 Brotli bytes. All existing selective and complete-entry budgets remain unchanged.

The follow-up preserves Unicode letter/number boundaries and the documented empty-string URL-policy rejection behavior. Valid and malformed candidates share text-node construction. The 336 tests include 50 extension cases and HTML/React/Octane parity. Exact-head CI covers full verify, the external corpus, packed consumers on Node 22/24 with React 18/19, skills and six streaming-browser combinations.

## Matched throughput controls

The comparison uses the original extension source at `90796de9df55de2ffa2028aafa972dfac431b24f` with the same current core, compiler, fixtures and completed output. Every streamed update is compared before timing. Astral-boundary and empty-policy cases deliberately change output and are excluded from throughput comparisons.

Each variant runs in a fresh Node process, with 1,000 warmups per fixture, three fixed-iteration samples and five reversed-order process rounds. An emitted-byte-identical original/control pair detects noise. Calibration on an isolated GitHub runner with Node 24.22.1 kept control medians within 2% across six fixtures. Desktop samples overlapped other local validation and are rejected.

Two initial isolated comparisons observed candidate/original ratios of 1.033-1.043 for repeated URL-free prose, 0.952-0.989 for URL-heavy text, 1.010-1.033 for BMP boundaries, 0.997-1.004 for malformed input, 1.000-1.011 for the AI response and 0.992-1.013 for progressive AI updates. One prose control differed by 7%, so these figures do not establish a general speedup. The cleaner repeat's prose difference was about 1.2 microseconds for a 4,960-byte fixture. A final independent repeat is retained with the run receipts before promotion.

These are enabled-extension comparisons, not a claim about default core performance or browser speed. Sampled allocation is separate from retained heap, RSS and peak memory. Local allocation samples suggested fewer allocations for URL-heavy and malformed fixtures, but do not establish a general memory improvement.

Reproduce the isolated calibration before comparison with the opt-in `ci.yml` workflow inputs `autolink_calibration=true` and `autolink_mode=calibrate` or `compare`. Raw fixtures, source/emitted hashes, runtime metadata and all samples are uploaded by the workflow. The CLI equivalent is:

```sh
node scripts/bench-autolinks-compare.mjs artifacts/autolink-comparison calibrate
node scripts/bench-autolinks-compare.mjs artifacts/autolink-comparison-compare compare
pnpm run verify
```
