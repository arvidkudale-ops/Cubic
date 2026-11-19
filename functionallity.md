# csTimer — Complete Functionality Inventory

> A broad feature checklist for a speedcubing timer inspired by csTimer. This inventory consolidates the features discussed in the conversation. Exact availability and behavior can vary by csTimer version, browser, and connected hardware; verify against the current official documentation before treating every item as confirmed.

## 1. Main Timer Functionality

- [ ] Keyboard-based timing using Space
- [ ] Hold Space until the timer indicator turns green, then release to start
- [ ] Stop timing by pressing a key
- [ ] Left + Right Ctrl alternative start trigger
- [ ] Mouse-based timing
- [ ] Touchscreen-based timing
- [ ] Manual time entry
- [ ] Typing mode for entering solves
- [ ] Stackmat timer input
- [ ] Bluetooth smart cube timing
- [ ] Bluetooth smart timer input
- [ ] Virtual cube solving and timing
- [ ] QCube input mode
- [ ] Last-layer timing mode
- [ ] Millisecond timing precision
- [ ] Display milliseconds
- [ ] Configurable time display format
- [ ] Configurable timer refresh/update behavior
- [ ] Configurable Space hold duration
- [ ] Hide interface elements while timing
- [ ] Configurable timer size
- [ ] Configurable timer font
- [ ] Smaller decimal digits
- [ ] Zoom controls

## 2. WCA Inspection

- [ ] Official 15-second inspection countdown
- [ ] Automatic +2 penalty after exceeding 15 seconds
- [ ] Automatic DNF penalty after exceeding the applicable inspection limit
- [ ] Voice announcements at 8 seconds
- [ ] Voice announcements at 12 seconds
- [ ] Adjustable inspection voice volume
- [ ] Inspection integrated with the timer
- [ ] Inspection support on mobile devices

## 3. Scramble Generation

- [ ] Generate random scrambles
- [ ] Generate scrambles for official WCA events:
  - [ ] 2x2
  - [ ] 3x3
  - [ ] 4x4
  - [ ] 5x5
  - [ ] 6x6
  - [ ] 7x7
  - [ ] 3x3 One-Handed
  - [ ] 3x3 Blindfolded
  - [ ] 3x3 Fewest Moves
  - [ ] 4x4 Blindfolded
  - [ ] 5x5 Blindfolded
  - [ ] 3x3 Multi-Blind
  - [ ] Pyraminx
  - [ ] Megaminx
  - [ ] Skewb
  - [ ] Square-1
  - [ ] Clock
- [ ] Generate scrambles for additional twisty puzzles
- [ ] Customize scramble length where supported
- [ ] Customize scramble text size
- [ ] Automatically resize scramble text
- [ ] Monospaced scramble font
- [ ] Scramble alignment settings
- [ ] Scramble area height limit
- [ ] Scrollable scramble area
- [ ] View previous scramble
- [ ] Generate next scramble
- [ ] Copy scramble
- [ ] Configure the action performed when clicking a scramble
- [ ] Pre-scramble moves
- [ ] Color-neutral training scrambles
- [ ] Training scramble case filters
- [ ] Customize training case probabilities
- [ ] Equal probability for every training case
- [ ] Randomized training case distribution
- [ ] Frequency-weighted training case distribution
- [ ] Control case appearance across a sequence
- [ ] Faster non-official 4x4 random-move scrambles
- [ ] Highlight important moves in scrambles
- [ ] Common scrambles generated from a shared seed
- [ ] Generate up to 999 scrambles in a batch
- [ ] Generate scramble images
- [ ] Display scramble images alongside notation

## 4. Training Scrambles

- [ ] F2L training
- [ ] OLL training
- [ ] PLL training
- [ ] ZBLL training
- [ ] Other last-layer training
- [ ] Cross training
- [ ] X-cross training
- [ ] Select specific cases
- [ ] Filter cases
- [ ] Color-neutral training
- [ ] Configure case probabilities
- [ ] Uniform case distribution
- [ ] Randomized case distribution
- [ ] Frequency-weighted case distribution
- [ ] Training scrambles for individual solving steps
- [ ] Training scrambles compatible with virtual cube practice

## 5. Time List and Solve Management

- [ ] Complete solve history
- [ ] Current session time list
- [ ] Current single
- [ ] Current average
- [ ] Best single
- [ ] Best average
- [ ] Current Ao5
- [ ] Current Ao12
- [ ] Display average labels below the timer
- [ ] View individual solve details
- [ ] View the scramble associated with each solve
- [ ] View solving date
- [ ] Add and view solve comments
- [ ] View reconstruction when available
- [ ] Edit solve times
- [ ] Manually add solves
- [ ] Delete individual solves
- [ ] Delete latest solve
- [ ] Delete all solves in a session
- [ ] Delete multiple solves at once
- [ ] Mark solves as OK
- [ ] Give solves a +2 penalty
- [ ] Mark solves as DNF
- [ ] Add comments to solves
- [ ] Copy solve scrambles
- [ ] Confirm-time tool for reviewing solves
- [ ] Reverse solve-list order
- [ ] Show solve numbers
- [ ] Show absolute solve indices in statistics
- [ ] View statistics for individual solves
- [ ] Show a statistics summary before the time list
- [ ] Show scramble information in statistics
- [ ] Show solving dates in statistics
- [ ] Configure the number of trimmed solves in averages
- [ ] Configure statistical indicators
- [ ] Display AoX statistics
- [ ] Display MoX statistics
- [ ] Display target time needed to beat a session PB
- [ ] Display PB-related notifications in the logo

## 6. Sessions

- [ ] Create multiple sessions
- [ ] Rename sessions
- [ ] Delete sessions
- [ ] Empty sessions
- [ ] Switch between sessions
- [ ] Automatically create sessions when switching puzzle types
- [ ] Automatically rename newly created sessions
- [ ] Split sessions
- [ ] Merge sessions
- [ ] Organize solves into separate sessions
- [ ] Perform cross-session statistics
- [ ] View statistics across multiple sessions
- [ ] View statistics across different puzzles
- [ ] View statistics across different time periods
- [ ] Configure session deletion behavior
- [ ] Create a new empty session without clearing the current one

## 7. Statistics and Analytics

- [ ] Single statistics
- [ ] Average of 5
- [ ] Average of 12
- [ ] Mean of 3
- [ ] Mean of X
- [ ] Average of X
- [ ] Best single
- [ ] Best average
- [ ] Current average
- [ ] Session statistics
- [ ] Cross-session statistics
- [ ] Cross-puzzle statistics
- [ ] Daily statistics
- [ ] Weekly statistics
- [ ] Monthly statistics
- [ ] Yearly statistics
- [ ] Solve count per day
- [ ] Time distribution analysis
- [ ] Solve consistency analysis
- [ ] Time distribution histogram
- [ ] Configurable time distribution intervals
- [ ] Time trend graphs
- [ ] Graph of all solves in a session
- [ ] Ao5 trend line
- [ ] Ao12 trend line
- [ ] PB tracking
- [ ] Target time to beat PB
- [ ] Detailed round statistics
- [ ] Custom statistical indicators
- [ ] Customizable trimmed averages
- [ ] Statistics based on solve ranges
- [ ] Statistics across different time periods

## 8. Scramble Visualization

- [ ] 2D scramble images
- [ ] Scramble images for supported WCA puzzles
- [ ] Display scramble image with scramble notation
- [ ] Configurable scramble image size
- [ ] Pre-scramble support
- [ ] Visual verification of scrambles
- [ ] Highlight important scramble moves
- [ ] Draw scramble tool

## 9. Solvers

- [ ] Roux S1 solver — first 1x2x3 block
- [ ] EOLine solver — edge orientation and DF/DB positioning
- [ ] Cross solver — four cross edges
- [ ] 2x2x2 Face solver
- [ ] Cross + F2L solver
- [ ] Roux S1 + S2 solver
- [ ] Petrus 2x2x2 + 2x2x3 solver
- [ ] EOLine + ZZF2L solver
- [ ] Square-1 S1 + S2 solver
- [ ] Pyraminx V solver
- [ ] Skewb Face solver
- [ ] Generate solutions for particular solving stages
- [ ] Display solution move count
- [ ] Display solutions progressively
- [ ] Reveal solutions one move at a time
- [ ] Display the complete solution
- [ ] Use solvers for learning and practice

## 10. Virtual Rubik's Cube

- [ ] Interactive virtual cube
- [ ] Scramble the virtual cube
- [ ] Solve the virtual cube
- [ ] Animate cube turns
- [ ] Configure virtual cube turning speed
- [ ] Configure base turns per second (TPS)
- [ ] Automatically speed up sequences of multiple moves
- [ ] Connect virtual cube to timing
- [ ] Record virtual solving times
- [ ] Automatic multi-phase timing
- [ ] Support training scrambles
- [ ] Support partial-solution training
- [ ] Keyboard controls for virtual cube

## 11. Bluetooth Smart Cube Integration

- [ ] Connect compatible Bluetooth smart cubes
- [ ] Automatically record solves
- [ ] Track individual cube turns
- [ ] Generate solve reconstructions
- [ ] View live cube state
- [ ] View battery level
- [ ] Display virtual Bluetooth cube
- [ ] Real-time reconstruction
- [ ] Automatic CFOP phase segmentation
- [ ] Multi-phase timing
- [ ] Normal Bluetooth cube mode
- [ ] Training mode
- [ ] Continuous training mode
- [ ] Automatically transition to the next training solve
- [ ] Detect whether the cube is solved when connecting
- [ ] Mark cube as scrambled after remaining stationary
- [ ] Mark cube as scrambled using Space
- [ ] Mark cube as scrambled using specific move sequences
- [ ] Beep when the cube is marked scrambled
- [ ] Automatic hardware error detection
- [ ] Detect potentially missing turns
- [ ] Configure Bluetooth cube behavior

> Hardware compatibility depends on the cube, browser, operating system, and Bluetooth support.

## 12. Stackmat Integration

- [ ] Connect compatible Stackmat timers
- [ ] Automatically record Stackmat times
- [ ] Display Stackmat connection status
- [ ] Display Stackmat signal status
- [ ] Display power information when available
- [ ] Display signal noise level when available
- [ ] Use Stackmat status information for timing
- [ ] Detect whether the left sensor is touched
- [ ] Detect whether the right sensor is touched
- [ ] Configure Stackmat behavior

## 13. Auxiliary Tools

- [ ] Scramble Generator — generate batches of scrambles
- [ ] Confirm Time — review and confirm solves
- [ ] Cross-session Stats — compare sessions
- [ ] Statistics — display statistical tables
- [ ] Time Distribution — analyze time distribution and consistency
- [ ] Time Trend — graph solve-time trends
- [ ] Daily Statistics — track solves over time
- [ ] Draw Scramble — draw the scrambled cube
- [ ] Roux S1 Solver
- [ ] EOLine Solver
- [ ] Cross Solver
- [ ] 2x2x2 Face Solver
- [ ] Cross + F2L Solver
- [ ] Roux S1 + S2 Solver
- [ ] Petrus Solver
- [ ] EOLine + ZZF2L Solver
- [ ] Square-1 S1 + S2 Solver
- [ ] Pyraminx V Solver
- [ ] Skewb Face Solver
- [ ] Bluetooth Cube panel
- [ ] Metronome
- [ ] Stackmat diagnostics
- [ ] Display up to four tools simultaneously

### Metronome

- [ ] Beep at a fixed frequency
- [ ] Configure beep frequency
- [ ] Beep at a specific elapsed time after starting a solve
- [ ] Use rhythmic timing to practice TPS

### Common Scrambles

- [ ] Generate scrambles using a common seed
- [ ] Share the seed with friends
- [ ] Generate identical scramble sequences across multiple people

## 14. Exporting, Importing, and Backups

- [ ] Export all solve data
- [ ] Import solve data
- [ ] Export current session
- [ ] Export data to local files
- [ ] Back up data to csTimer servers
- [ ] Back up data to Google Storage, where supported
- [ ] Automatically export after a configurable number of solves (the discussed example was every 100 solves)
- [ ] Configure automatic export destination
- [ ] Restore previous backups
- [ ] Import non-latest backups
- [ ] Recover from accidentally uploading an empty backup
- [ ] Access recent server backups (the discussed limit was up to 10)
- [ ] Preserve solve information and associated data

## 15. Keyboard Shortcuts

The following shortcuts were listed in the earlier inventory. Verify exact mappings against the current version and the user's configured key bindings.

| Shortcut | Action |
|---|---|
| Alt + 1 | Square-1 scrambles |
| Alt + 2–7 | 2x2 through 7x7 |
| Alt + P | Pyraminx |
| Alt + M | Megaminx |
| Alt + C | Clock |
| Alt + S | Skewb |
| Alt + I | Input scramble |
| Alt + D | Delete all solves in session |
| Ctrl/Alt + Z | Delete latest solve |
| Alt + Up/Down | Switch sessions |
| Alt + Left/Right | Previous/next scramble |
| Ctrl + 1 | Mark latest solve OK |
| Ctrl + 2 | Mark latest solve +2 |
| Ctrl + 3 | Mark latest solve DNF |
| Ctrl + Alt + T | Keyboard timer |
| Ctrl + Alt + I | Typing mode |
| Ctrl + Alt + S | Stackmat |
| Ctrl + Alt + V | Virtual cube |
| Ctrl + Alt + G | Bluetooth cube |
| Ctrl + Alt + Q | QCube |
| Ctrl + Alt + B | Bluetooth timer |
| Ctrl + Alt + L | Last-layer timing |

## 16. Gesture Controls

The following gesture mappings were listed in the earlier inventory; exact availability can depend on device and configuration.

| Gesture | Action |
|---|---|
| Swipe up-left | DNF |
| Swipe up | +2 |
| Swipe up-right | OK |
| Swipe left | Previous scramble |
| Swipe right | Next scramble |
| Swipe down-left | Add comment |
| Swipe down | Delete solve |
| Swipe down-right | Check solve |

## 17. Interface Customization

- [ ] Multiple color themes
- [ ] Custom background image
- [ ] Background image opacity adjustment
- [ ] Custom timer font
- [ ] Custom timer size
- [ ] Custom interface zoom
- [ ] Material-like interface design
- [ ] Hide interface shadows
- [ ] Desktop interface layout
- [ ] Mobile interface layout
- [ ] Embedded scramble panel
- [ ] Embedded statistics panel
- [ ] Embedded tools panel
- [ ] Hide all elements while timing
- [ ] Custom scramble panel positioning
- [ ] Custom scramble alignment
- [ ] Custom scramble text sizing
- [ ] Custom scramble image sizing
- [ ] Configure number of simultaneous tools (up to four)
- [ ] Show average labels below timer
- [ ] Show PB hints and notifications in logo
- [ ] Configure solve-list appearance
- [ ] Reverse solve-list order
- [ ] Customize statistics display

## 18. Mobile and Browser Functionality

- [ ] Desktop browser support
- [ ] Mobile browser support
- [ ] Tablet support
- [ ] Touchscreen timing
- [ ] Add to home screen
- [ ] Installable app-like experience, where supported
- [ ] Browser caching
- [ ] Offline operation after initial loading, where supported
- [ ] Local solve storage
- [ ] Online backup functionality
- [ ] Multilingual interface

## 19. Extremely Niche Settings

- [ ] Choose whether an integer entered manually represents seconds, centiseconds, or milliseconds
- [ ] Choose timer update behavior
- [ ] Configure how long Space must be held before the timer turns green
- [ ] Choose whether Stackmat sensor-status information is used
- [ ] Automatically adjust scramble text size according to scramble length
- [ ] Use a monospaced scramble font
- [ ] Limit scramble panel height
- [ ] Set scramble alignment
- [ ] Add pre-scramble moves
- [ ] Randomize training scramble orientation
- [ ] Set training-case probability distributions
- [ ] Use non-official random-move 4x4 scrambles
- [ ] Highlight important scramble moves
- [ ] Configure what clicking the scramble does
- [ ] Set the number of trimmed solves when calculating averages
- [ ] Display a statistics summary before the solve list
- [ ] Display the target time needed to beat a PB
- [ ] Include scrambles in statistics reports
- [ ] Include solve dates in statistics reports
- [ ] Automatically rename new sessions
- [ ] Automatically create sessions when changing puzzle types
- [ ] Reverse the solve list
- [ ] Disable session emptying to avoid accidental deletion
- [ ] Show absolute solve indices in statistics
- [ ] Show statistics when clicking solve numbers
- [ ] Customize statistical indicators
- [ ] Enable multiple-solve deletion
- [ ] Configure time-distribution precision
- [ ] Progressively reveal solver solutions
- [ ] Configure scramble image size
- [ ] Display up to four tools simultaneously
- [ ] Enable or disable keyboard shortcuts
- [ ] Enable or disable gesture controls
- [ ] Set virtual cube base TPS
- [ ] Configure automatic multi-phase splitting
- [ ] Select Bluetooth cube operating mode
- [ ] Display virtual Bluetooth cube
- [ ] Configure how Bluetooth cubes are marked scrambled
- [ ] Enable scrambled-state notification sounds
- [ ] Reset Bluetooth cube when connecting
- [ ] Enable automatic hardware error detection

## 20. Particularly Notable Capabilities

These are especially interesting features to consider when designing a speedcubing timer:

- [ ] Live reconstruction from Bluetooth smart-cube move data
- [ ] Automatic CFOP phase segmentation
- [ ] Built-in solvers for specific stages of multiple solving methods
- [ ] Time-trend analytics and rolling averages
- [ ] Common scrambles through shared random seeds
- [ ] Virtual cube practice with specialized training modes
- [ ] Cross-session and cross-puzzle statistics
- [ ] Hardware integrations for smart cubes and Stackmat timers
- [ ] Configurable training-case distributions
- [ ] Multi-tool workspace

## References

- [csTimer official website](https://cstimer.net/)
- [csTimer GitHub repository](https://github.com/cs0x7f/cstimer)

---

**Note:** This is a consolidated functionality checklist based on the feature inventory in this conversation. It is not an official csTimer specification or a guarantee that every listed item exists in every release. Confirm version-specific details, shortcut mappings, and hardware compatibility against the current csTimer documentation and source code.
