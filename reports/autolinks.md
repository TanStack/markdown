# Optional HTTP(S) autolinks

Based on Silouan Wright's PR #20 and composed with released Markdown 1.0.1. The extension stays opt-in, adds no runtime dependency, and leaves existing parser and renderer source unchanged.

The standalone entry passes the original draft ceiling of 994 minified bytes, 632 gzip bytes and 568 Brotli bytes. All existing selective and complete-entry budgets remain unchanged.

The follow-up preserves Unicode letter/number/combining-mark boundaries and the documented empty-string URL-policy rejection behavior. Valid and malformed candidates share text-node construction. The 337 tests include 51 extension cases and HTML/React/Octane parity. Exact-head CI covers full verify, the external corpus, packed consumers on Node 22/24 with React 18/19, skills and six streaming-browser combinations.

## Matched throughput controls

The comparison uses the original extension source at `90796de9df55de2ffa2028aafa972dfac431b24f` with the same current core, compiler, fixtures and completed output. Every streamed update is compared before timing. Astral-boundary and empty-policy cases deliberately change output and are excluded from throughput comparisons.

Each variant runs in a fresh Node process, with 1,000 warmups per fixture, three fixed-iteration samples and five reversed-order process rounds. An emitted-byte-identical original/control pair detects noise. Calibration on an isolated GitHub runner with Node 24.22.1 kept control medians within 2% across six fixtures. Desktop samples overlapped other local validation and are rejected.

Two isolated comparisons of the final combining-mark boundary source observed candidate/original ratios of 0.983-1.065 for repeated URL-free prose, 0.971-0.977 for URL-heavy text, 1.018-1.026 for BMP boundaries, 0.980-0.993 for malformed input, 0.997-1.009 for the AI response and 0.993-1.001 for progressive AI updates. Identical-control ratios ranged from 0.968 to 1.022, so these figures do not establish a general speedup. The largest observed prose difference was about 2.4 microseconds for a 4,960-byte fixture. Earlier calibration and three prior-source comparisons are retained separately, rather than counted as final-source repeats.

These are enabled-extension comparisons, not a claim about default core performance or browser speed. Sampled allocation is separate from retained heap, RSS and peak memory. Local allocation samples suggested fewer allocations for URL-heavy and malformed fixtures, but do not establish a general memory improvement.

Reproduce the isolated calibration before comparison with the dedicated `autolink-benchmarks.yml` workflow with `mode=calibrate` or `compare`. This workflow becomes available for dispatch after it reaches the default branch. Before merge, use the CLI commands below. Raw fixtures, source/emitted hashes, runtime metadata and all samples are uploaded by the workflow. The CLI equivalent is:

```sh
node scripts/bench-autolinks-compare.mjs artifacts/autolink-comparison calibrate
node scripts/bench-autolinks-compare.mjs artifacts/autolink-comparison-compare compare
pnpm run verify
```
