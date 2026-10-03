# Portfolio — Hikaru Ogasawara

**English** · [Português](README.pt-BR.md) · [日本語](README.ja.md)

An interactive pixel-art portfolio: an explorable room with projects, a lab, a skill tree, minigames, résumés and a fast lane for recruiters. Available in English, Portuguese and Japanese.

**Visit:** [hikaru-0gasawara.github.io/Portifolio](https://hikaru-0gasawara.github.io/Portifolio/)

## About me

Nice to meet you! I'm Hikaru Ogasawara (小笠原 光), 21, based in São Paulo and studying Computer Engineering at Ibmec, with graduation expected in 2027. I enjoy hardware, infrastructure and security, and spend much of my time building labs and personal projects.

Since childhood I've enjoyed building things, fixing what breaks and discovering how things work inside. That curiosity remains; only the tools have changed: the screwdriver became a multimeter, a terminal and firmware. I learn by doing: build, test, measure, break it and build it again until it's right, understanding the why before accepting the how.

Outside university, I'm vice president of Ycare, a volunteer organization that delivers food and hygiene baskets to a community on the second Saturday of each month. I handle fundraising, packing the baskets and coordinating volunteers. In my spare time, I play a bit of everything.

| | |
| --- | --- |
| **Education** | Computer Engineering at Ibmec (bachelor's, 2023–2027, expected) · Instituto Sidarta (high school, 2010–2022) |
| **Languages** | Native Portuguese · English: fluent reading, conversational speaking · upper-intermediate Japanese · intermediate Spanish |
| **Strengths** | Calm under pressure · initiative · self-motivation · teamwork · respect for deadlines |
| **Seeking** | An internship in infrastructure, security or embedded systems |

## Contact and résumés

- **Email:** [hogasawara2311@outlook.com](mailto:hogasawara2311@outlook.com)
- **LinkedIn:** [/in/hikaru-ogasawara](https://www.linkedin.com/in/hikaru-ogasawara)
- **GitHub:** [Hikaru-0gasawara](https://github.com/Hikaru-0gasawara)
- **Résumé:** [English](public/resume/hikaru-en.pdf) · [Português](public/resume/hikaru-pt.pdf) · [日本語](public/resume/hikaru-ja.pdf)

## Projects

| Project | Area | Summary | Code |
| --- | --- | --- | --- |
| **AquaSense IoT** | IoT · firmware · web | ESP32 firmware for 7 water parameters, MQTT/TLS and a dashboard (Feb–Jun 2026) | [repository](https://github.com/Hikaru-0gasawara/IoT-PoolHardWareTest) |
| **Infrastructure lab** | Infrastructure · security | AD/DC, IPFire firewall and SIEM built from scratch, virtualized on Proxmox (academic) | — |
| **Electronic safe** | Embedded · C++ | The same safe ported to Arduino UNO, Raspberry Pi Pico and ESP32 (personal) | [repository](https://github.com/Hikaru-0gasawara/IoT-SafeSistem) |
| **CPTM assets** | Back end · Java | REST API with 14 endpoints for trains, stations and lines (Feb–Jul 2024) | [repository](https://github.com/0tavio-Pires/Projeto_Back-End) |

In the portfolio, each project has a description, a gallery of diagrams (plus screenshots of the dashboard for AquaSense) and the technical details.

## Technologies

- **Hardware and firmware:** ESP32, Arduino UNO, Raspberry Pi Pico, C/C++, MicroPython, I²C, UART, PWM, MQTT over TLS, LogiSim
- **Infrastructure and security:** Proxmox, Windows Server with AD/DC, Linux, DNS, DHCP, IPFire, iptables, ufw, SIEM, Kali Linux
- **Software:** Python, Java with Spring Boot, TypeScript with React, HTML and CSS, SQL
- **Data and cloud:** Jupyter, NumPy, pandas, Excel, Power BI, AWS Lambda, Alexa Skills Kit
- **Tools and testing:** Git, GitHub Actions, Vitest, Playwright, JUnit, Postman

## The portfolio

The site itself is the demo: instead of just listing skills, it's a small game that shows what I can do.

- **Language select:** the first screen, an 8-bit menu under a pixel sky, with a cursor, an equalizer and its own soundtrack that changes style with the language under the cursor: samba for Portuguese, rock for English and matsuri for Japanese.
- **TV entrance:** after the language, a 3D television you can spin with the mouse and look at from behind, above and below, speaking the chosen language. It starts switched on, on the recruiter-mode channel (**“In a hurry? Break here”**), and has five more channels (fighting, monster battle, live show, RPG and western), volume, a power button and its own soundtrack playing through its speaker. **Enter** dives the camera into the screen and starts the boot. Holding the portfolio's power button turns everything off and leaves through the TV: the camera pulls back out of the screen, the reverse of the entrance, and the TV turns on again.
- **Boot:** a startup console with diagnostics and, every now and then, a fake crash buried under made-up error pop-ups, followed by a recovery.
- **Pages:** Home, Projects, About and Contact, walked by Hikaru himself in pixel art. He walks between the doors, trips now and then and sometimes takes a shortcut through the portals. Every page and the room are linked by hidden passages: a pedestal, doors and hatches drawn on the lines of the schematic and the panels, a door by the About title, two payphones linking Home and Contact, a passage behind the “?” of CONTINUE? and, in the room, a hatch under the pinball, stairs behind the shelf and a tunnel under the bed. The home buttons are passages themselves: **View projects** splits open like a trapdoor and drops him onto Projects, and **About me** slides aside over a secret staircase down to About.
- **Room:** a shelf, a Magic deck collection, plushies, arcade cabinets, a CRT TV with picture styles, a beanbag with a brick-breaker game and a computer with its own desktop (terminal, profile, skill tree, résumé, Lab and an offline game).
- **Hitbox:** a fighting-game controller on About, with 42 moves from 22 fighters from Street Fighter, Mortal Kombat, Skullgirls, Guilty Gear and Avatar, plus Okaru's tech moves. Every move hits a training dummy.
- **Minigames:** cartridges for Game Boy, Atari, Master System, N64 and a modern controller, plus the Packet Invaders and Operation Circuit arcade cabinets.
- **Achievements:** 51 achievements spread across the site.
- **Recruiter mode:** a fast lane to projects and résumés for those short on time, with the same sound as the portfolio. To open it, break the entrance TV's screen (three knocks on the glass of the first channel) or the emergency glass in the pause menu.
- **Title screen:** its own 8-bit soundtrack, hover sounds and a button (or the `M` key) to mute.
- **On phones:** a touch joystick with **A** and **B**, and the section buttons fold into the logo, which opens them as a menu.

### Main controls

| Action | How |
| --- | --- |
| Walk | `WASD` or arrow keys (on phones, the on-screen joystick; **A** uses and **B** runs) |
| Interact | `E`, space or click |
| Pause and menu | `Esc` |
| Command palette and console | `Ctrl+K` |
| Language and reduced motion | Pause menu |

Everything runs in the browser, with no sign-up, tracking or server: progress, language and achievements are saved only in your browser.

## Code

Built with HTML, CSS and JavaScript, with React and fonts served locally, and no game or 3D libraries: the entrance television is rendered with hand-written WebGL. The technical notes (running locally, publishing, architecture, résumés and tests) are in [docs/](docs/), in Portuguese.
