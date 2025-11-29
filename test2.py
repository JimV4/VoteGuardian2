# -*- coding: utf-8 -*-
import re

def insert_language_tags(text: str) -> str:
    def is_greek(char):
        return (
            ('\u0370' <= char <= '\u03FF') or  # Greek and Coptic
            ('\u1F00' <= char <= '\u1FFF')     # Greek Extended
        )

    result = []
    current_lang = None
    i = 0

    # Regex to detect patterns like \english word
    english_word_pattern = re.compile(r'\\english\s+\w+')

    while i < len(text):
        # If a backslash-english pattern is found, copy it as-is and skip
        match = english_word_pattern.match(text, i)
        if match:
            result.append(match.group())
            i = match.end()
            continue

        char = text[i]

        # Skip LaTeX-like commands (anything starting with backslash)
        if char == '\\':
            cmd_start = i
            while i < len(text) and text[i] not in [' ', '\n']:
                i += 1
            result.append(text[cmd_start:i])
            continue

        if is_greek(char):
            if current_lang != 'greek':
                result.append("\\selectlanguage{greek}")
                current_lang = 'greek'
        else:
            if char.isalpha():
                if current_lang != 'english':
                    result.append("\\selectlanguage{english}")
                    current_lang = 'english'
        result.append(char)
        i += 1

    return ''.join(result)


if __name__ == "__main__":
    sample_text = r"""
   \documentclass[12pt,a4paper]{report}

\usepackage[utf8]{inputenc}
\usepackage[LGR,T1]{fontenc}        % LGR για ελληνικά, T1 για αγγλικά
\usepackage[greek,english]{babel}
\usepackage{lmodern}                
\renewcommand{\rmdefault}{lmr}      
\usepackage{listings}
\usepackage{xcolor}

\lstset{
  basicstyle=\ttfamily\small,
  backgroundcolor=\color{gray!10},
  keywordstyle=\color{blue}\bfseries,
  stringstyle=\color{green!50!black},
  commentstyle=\color{gray}\itshape,
  showstringspaces=false,
  breaklines=true,
  frame=single,
  tabsize=2
}

\usepackage{amsmath}
\usepackage{graphicx}
\usepackage{setspace}
\usepackage{geometry}
\geometry{margin=1in}

\usepackage{tikz}                   % <-- MUST include TikZ package
\usetikzlibrary{trees} 
\begin{document}

% ------------------ Title Page -------------------
\begin{titlepage}
    \centering
    
    \vspace*{1cm}
    {\Large National Technical University of Athens \\}
    {\large School of Electrical and Computer Engineering \\}
    {\large Computer Science Laboratory \\}
    
    \vfill
    
    {\LARGE \textbf{Student Voting DApp on Midnight Blockchain} \\[1.5cm]}
    
    {\Large \textbf{DIPLOMA THESIS} \\[1.5cm]}
    
    {\Large VASSILIOU DIMITRIOS \\}
    
    \vfill
    
    {\large September 2025}
\end{titlepage}

\tableofcontents
\newpage

% ------------------ First Chapter Introcution -------------------
\chapter{Introduction}

Blockchain technology is a distributed ledger system that enables secure,
transparent, and tamper-resistant recording of digital transactions. Unlike
traditional centralized databases, a blockchain is maintained collectively
by a network of participants, eliminating the need for a single trusted
authority.

Each block in the chain contains a group of transactions, a timestamp, and
a cryptographic hash of the previous block, which together ensure
immutability and traceability. Once information is added, it is extremely
difficult to alter without the consensus of the network.

Key features of blockchain include:
\begin{itemize}
    \item \textbf{Decentralization} -- data is stored and verified across many
    nodes instead of a central server.
    \item \textbf{Transparency} -- transactions are visible to all participants
    in the network.
    \item \textbf{Security} -- cryptographic mechanisms make it resistant to
    fraud and tampering.
    \item \textbf{Consensus mechanisms} -- such as Proof of Work or Proof of
    Stake, which ensure agreement among participants.
\end{itemize}

Initially introduced with Bitcoin in 2008 as the backbone of digital
currency, blockchain technology has since evolved far beyond cryptocurrencies.
It is now being applied in areas such as supply chain management, healthcare,
identity verification, and voting systems.
This thesis focuses on \textit{Midnight}, a blockchain platform designed with
a strong emphasis on security, user privacy, and transparency. By leveraging
advanced cryptographic techniques, particularly zero-knowledge proofs, Midnight
enables participants to prove the validity of information without revealing the
underlying data. These characteristics make Midnight an ideal foundation for the
development of a decentralized voting application, where trust, confidentiality,
and verifiability are essential requirements.

% ------------------ Motivation -------------------
\section{Motivation}
Voting is a fundamental process that embodies the practical application of democracy. 
It serves as a mechanism for decision-making in a wide range of contexts, including 
government elections, professional associations, social organizations, and educational 
institutions. The integrity of the voting process is therefore critical, as it ensures 
that outcomes reflect the true will of the participants. For this reason, a voting system 
must be transparent, fair, and anonymous to protect the identity and privacy of those 
participating.

Traditional voting systems, whether paper-based or electronic, often face significant 
challenges. Paper ballots are susceptible to human error and manipulation, while 
centralized electronic systems can be vulnerable to cyberattacks, tampering, and data 
leaks. In the context of student elections, conventional electronic systems typically 
require a central server and a database where students’ personal information and votes 
are stored. This creates a situation where students must reveal their choices to the 
institution, which compromises the principle of voter anonymity and can undermine trust 
in the process.

Moreover, centralized systems introduce a single point of failure, meaning that any 
breach, mismanagement, or technical malfunction could jeopardize the entire election. 
These vulnerabilities highlight the need for alternative approaches that can ensure both 
security and privacy while maintaining transparency and verifiability. A blockchain-based 
solution, particularly one leveraging advanced cryptographic techniques such as zero-knowledge 
proofs, offers a promising avenue to address these issues. By removing the need for a 
central authority and enabling cryptographically verifiable yet private voting, such a 
system can safeguard anonymity, prevent fraud, and enhance trust in student votings.
\newpage

% ------------------ Second Chapter Theoretical Background-------------------
\chapter{Theoretical Background}
\selectlanguage{english}
In this section, we present the fundamental theoretical background relevant to this thesis. 
We begin by introducing the core concepts of blockchain technology, providing a foundation 
for understanding the decentralized systems underlying the proposed application. Next, we 
explore key cryptographic primitives employed in the DApp, including zero-knowledge proofs, 
hash functions, and Merkle trees, highlighting their roles in ensuring security, integrity, 
and privacy. Finally, we examine the Midnight blockchain in detail, focusing on its mechanisms 
for preserving user privacy and anonymity, which form the basis for the secure and confidential 
voting system developed in this work.

\section{Cryptographic primitives}
% ------------------ Hash Functions-------------------
\subsection{Hash Functions}
Hash functions are mathematical functions that take an input string \(A\) and produce 
a fixed-size output string \(B = H(A)\). Their primary strength lies in their 
one-way nature: it is computationally infeasible to reverse the function and recover 
the original input from the output. In other words, given \(B\), it is practically 
impossible to determine \(A\). This property makes hash functions a fundamental tool 
in cryptography for ensuring data integrity and security.
\newline
\newline
Several well-known hash functions are widely used in practice, including SHA-256, 
SHA-3, and the MD5 algorithm (although MD5 is considered insecure for modern applications). 
These functions are employed in digital signatures, blockchain systems, password 
hashing, and other security-critical applications.
\newline
\newline
A fundamental application of hash functions is in \textit{commitment schemes}. 
Suppose a user possesses a secret value \(S\) that should remain private. The user 
can commit to this secret by computing its hash, \(H(S)\). The resulting value, 
\(H(S)\), can then be published, for example, on a blockchain, serving as a 
cryptographic commitment to \(S\) without revealing the secret itself. Later, anyone can verify a claimed commitment by checking that the provided hash matches the previously published value \(H(S)\), ensuring the integrity of the commitment 
while keeping the secret \(S\) completely hidden.
\newline

% ------------------ Zero Knowledge Proofs------------------
\subsection{Zero Knowledge Proofs}
A zero-knowledge proof is a method by which a prover can convince a verifier that a certain statement is true without revealing any additional information beyond the truth of the statement. In other words, the prover demonstrates knowledge of a secret (or solution to a problem) without sharing the secret itself. For example, a ZKP could allow you to prove that you are eligible to vote in a student election without revealing your student identity. 
\selectlanguage{greek}
Αν και το μαθηματικό υπόβαθρο των αποδείξεων μηδενικής γνώσης ξεφεύγει από το σκοπό αυτής της εργασίας, αξίζει να περιγραφεί σε υψηλό επίπεδο ο τρόπος λειτουργίας τους:

\begin{itemize}
    \item Συμμετέχουν δύο μέρη: ο \selectlanguage{english}\textbf{prover},\selectlanguage{greek} που κατασκευάζει την απόδειξη θέλοντας να αποδείξει έναν ισχυρισμό ή μια πρόταση, και ο \textbf{verifier}, που ελέγχει την εγκυρότητά της. Ο prover κατέχει μια μυστική πληροφορία, τον \textit{witness}, και πρέπει να πείσει τον verifier για έναν ισχυρισμό χωρίς να αποκαλύψει τον witness.
    \item Ο ισχυρισμός του prover (ο οποίος θα μπορούσε να είναι μια πρόταση της μορφής: <<ανήκω στο σύνολο των έγκυρων ψηφοφόρων>>) αναπαρίσταται μέσω ενός μαθηματικού κυκλώματος, γνωστού ως zero-knowledge circuit.
    \item Στην αρχή πραγματοποιείται μια \textit{φάση αρχικοποίησης }, κατά την οποία δημιουργούνται τα αντίστοιχα \textit{proving} και \textit{verifying keys}.
    \item Ο prover χρησιμοποιεί τον witness και το proving key για να κατασκευάσει την απόδειξη.
    \item Ο verifier, χρησιμοποιώντας το verifying key αλλά και το μαθηματικό κύκλωμα, ελέγχει αν η απόδειξη είναι έγκυρη. Αν επαληθευθεί, τότε ο ισχυρισμός του prover θεωρείται αληθής· διαφορετικά, είτε ο ισχυρισμός είναι λανθασμένος είτε ο prover δεν γνωρίζει στην πραγματικότητα έναν έγκυρο witness.
\end{itemize}

% ------------------ Merkle Trees------------------

\subsection{Merkle Trees}
\selectlanguage{english}

Merkle trees are a cryptographic data structure widely used in blockchain systems 
and other applications requiring data integrity verification. Their key advantage 
is that they allow one to prove that a particular value belongs to a set without 
revealing any other elements of the set. This property is essential for efficient 
and privacy-preserving verification.

Structurally, a Merkle tree is a binary tree where each \textbf{leaf node} contains 
the hash of a data element, and each \textbf{parent node} contains the hash of the 
concatenation of its child nodes. This hierarchical hashing continues up to the 
root, called the \textbf{Merkle root}, which uniquely represents the entire set of data. 
Verifying that a value belongs to the set requires only a logarithmic number of 
hash computations, making Merkle trees highly efficient.


\begin{figure}[h!]
    \centering
    \begin{tikzpicture}[level distance=2.5cm,  % increase vertical spacing
      level 1/.style={sibling distance=6cm},   % increase horizontal spacing for first level
      level 2/.style={sibling distance=3cm}]   % increase horizontal spacing for second level
      \node {$\text{root}$}
        child {node {$H(H(A)\mid H(B))$}
          child {node {$H(A)$}}
          child {node {$H(B)$}}
        }
        child {node {$H(H(C)\mid H(D))$}
          child {node {$H(C)$}}
          child {node {$H(D)$}}
        };
    \end{tikzpicture}
    \caption{Merkle Tree Structure: Each leaf node contains a hash of a data element, and each parent node contains the hash of its children. The root node represents the hash of the entire dataset.}
    \label{fig:merkle_tree}
\end{figure}
In the figure above, we see a Merkle tree with leaf nodes $H(A)$, $H(B)$, $H(C)$, and $H(D)$. 
Each parent node contains the hash of its children, culminating in the Merkle root, which 
represents the hash of the entire dataset.  

Suppose that $A$, $B$, $C$, and $D$ represent secret keys of different users, and user $D$ 
wants to prove that they belong to the tree without revealing their secret key $D$. This 
can be achieved using a zero-knowledge proof based on the following procedure.  

The protocol provides user $D$ with only the hashes required to reconstruct the root, 
specifically $H(C)$ and $H(H(A) \mid H(B))$. Using these values along with their own 
hash $H(D)$, user $D$ computes the hash of the concatenation $(H(C) \mid H(D))$. 
Next, they combine this newly computed hash with the hash provided by the protocol 
$H(H(A) \mid H(B))$ to reconstruct the root:  
\[
H\big(H(H(A)\mid H(B)) \mid (H(C)\mid H(D))\big)
\]  
If the resulting hash matches the Merkle root, the proof is valid, and anyone can 
verify that user $D$ belongs to the tree without ever revealing the secret $D$. This 
process illustrates how Merkle trees, combined with zero-knowledge proofs, enable 
efficient and privacy-preserving verification of membership.

% ------------------ Midnight -------------------
\subsection{Midnight}
\selectlanguage{greek}
Σε αυτό το υπό-κεφάλαιο θα εξετάσουμε τα βασικά χαρακτηριστικά του \selectlanguage{english}Midnight\selectlanguage{greek}, δίνοντας έμφαση στον τρόπο λειτουργίας των \selectlanguage{english}smart contracts\selectlanguage{greek}, στον τρόπο με τον οποίο διασφαλίζεται η ανωνυμία των χρηστών των αποκεντρωμένων εφαρμογών που αναπτύσσονται σε αυτό το \selectlanguage{english}blockchain\selectlanguage{greek}, καθώς και στις μοναδικές δυνατότητες που προσφέρει για ασφαλείς και αυτοματοποιημένες συναλλαγές χωρίς την ανάγκη κεντρικών διαμεσολαβητών.
\selectlanguage{english}
\subsubsection{2.1.4.1 Lace Wallet}
\selectlanguage{greek}
Το \selectlanguage{english} Midnight \selectlanguage{greek} χρησιμοποιεί το \textbf{Lace Wallet} ως κύριο μέσο διεπαφής των χρηστών με τις αποκεντρωμένες εφαρμογές, αλλά και ως μέσο διεξαγωγής συναλλαγών μεταξύ τους. Κάθε wallet διαθέτει μια μοναδική διεύθυνση, ορατή στον έξω κόσμο, καθώς και ένα ζεύγος κλειδιών — το \textbf{public key} και το \textbf{private key} — που αναπαριστώνται ως δεκαεξαδικές συμβολοσειρές. Το \textbf{public key} λειτουργεί ως αναφορά για το ποιος χρήστης εκτέλεσε ένα συγκεκριμένο transaction, ενώ το \textbf{private key}, που παραμένει μυστικό ακόμα και στον ίδιο τον χρήστη, χρησιμοποιείται για την υπογραφή των συναλλαγών που πραγματοποιεί το wallet. Το νόμισμα που χρησιμοποιεί το Midnight για τις συναλλαγές είναι το \textbf{tDUST}.

\selectlanguage{english}
\subsubsection{2.1.4.2 Proof Server}
\selectlanguage{greek}

Οποιοσδήποτε επιθυμεί να χρησιμοποιήσει μια αποκεντρωμένη εφαρμογή βασισμένη στο \selectlanguage{english}Midnight\selectlanguage{greek} πρέπει να εγκαταστήσει και να τρέξει τοπικά στον υπολογιστή του τον \selectlanguage{english}proof server\selectlanguage{greek}, ο οποίος είναι ενθυλακωμένος μέσα σε ένα \selectlanguage{english}docker container\selectlanguage{greek}. Ο \selectlanguage{english}proof server\selectlanguage{greek} παράγει τις αποδείξεις μηδενικής γνώσης για κάθε \selectlanguage{english}transaction\selectlanguage{greek} ενός \selectlanguage{english}smart contract\selectlanguage{greek}. Οι αποδείξεις αυτές αποτελούν το εχέγγυο ότι ο χρήστης μιας αποκεντρωμένης εφαρμογής, και κατά συνέπεια του αντίστοιχου \selectlanguage{english}smart contract\selectlanguage{greek}, έχει ακολουθήσει όλους τους κανόνες που ορίζει κάθε \selectlanguage{english}transaction\selectlanguage{greek}. Στη συνέχεια, η απόδειξη προωθείται στο δίκτυο ώστε να επαληθευθεί η ορθότητά της.

Αξίζει να τονιστεί ότι ο \selectlanguage{english}proof server\selectlanguage{greek} δεν συνδέεται ποτέ στο διαδίκτυο ούτε αποστέλλει δεδομένα σε τρίτους αποδέκτες. Λειτουργεί αποκλειστικά τοπικά για κάθε χρήστη και παράγει αποδείξεις μηδενικής γνώσης με πλήρη ασφάλεια.

\selectlanguage{english}
\subsubsection{2.1.4.3 Smart Contracts \selectlanguage{greek}στο\selectlanguage{english} Midnight }
\selectlanguage{greek}
Το Midnight χρησιμοποιεί την compact ως γλώσσα προγραμματισμού για ανάπτυξη smart contracts, η οποία έχεθ αναπτυχθεί από την ομάδα του Midnight. Θα κάνουμε μια σύντομη περιήγηση στα βασικά στοιχεία της compact μέσω ενός απλού smart contract. Εκτενέστερη ανάλυση θα πραγματοποιηθεί κατά την παρουσίαση του smart contract που αναπτύχθηκε για τη δική μας εφαρμογή.
Παρουσιάζουμε παρακάτω ένα απλό smart contract το οποίο ορίζει μια public μεταβλητή και επιτρέπει μόνο στον δημιουργό του contract να την αλλάξει.
\selectlanguage{english}
\begin{figure}[h]
\begin{lstlisting} % you can choose other language or leave it generic
import CompactStandardLibrary;

witness secretKey(): Bytes<32>;

export ledger organizer: Bytes<32>;
export ledger restrictedCounter: Counter;
constructor() {
  organizer = publicKey(secretKey());
}

export circuit increment(): [] {
  assert(organizer == publicKey(secretKey()), "not authorized");
  restrictedCounter.increment(1);
}

circuit publicKey(sk: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([pad(32, "some-domain-seperator"), sk]);
}
\end{lstlisting}
\selectlanguage{greek}
\caption{Ένα απλό smart contract γραμμένο σε compact}
\end{figure}
\selectlanguage{greek}
\subsubsection{Το ledger και η public state}
Όσες μεταβλητές έχουν μπροστά τη λέξει-κλειδί \textbf{ledger} αποτελούν την public state του smart contract και είναι ορατές σε όλο το blockchain. Στο παράδειγμά μας, η μεταβλητή organizer είναι public και αποτελεί την διεύθυνση του δημιουργού του contract μέσω μιας δεκαεξαδικής συμβολοσειράς. Επίσης η μεταβλητή resrictedCounter είναι δημόσια και είναι ένας απλός μετρητής.

\subsubsection{Ο witness και η private state}
Όσες μεταβλητές έχουν μπροστά τη λέξη κλειδί \textbf{witness} αποτελούν την private state του smart contract και ζουν αποκλειστικά στον υπολογιστή του χρήστη. Είναι σημαντικό να τονιστεί ότι η πραγματική τιμή τους δεν είναι ποτέ ορατή στο smart contract, απλά όσες μεταβλητές έχουν τη λέξη witness μπροστά αποτελούν μια διεπαφή στην private state του χρήστη. Στο παράδειγμά μας η μεταβλητή secretKey αποτελεί το μυστικό κλειδί του χρήστη και η πραγματική της τιμή δεν αποκαλύπτεται ποτέ δημόσια, ούτε στο contract. Μόνο ο χρήστης γνωρίζει την τιμή της και είναι στη δική του δικαιοδοσία να ορίσει ποια θα είναι αυτή. Δηλαδή μπορεί διαφορετικοί χρήστες μιας αποκεντρωμένης εφαργμογής να ορίσουν ο καθένας τον δικό του witness, στη δική μας περίπτωση το δικό του secretKey.

\subsubsection{Τα circuits}
Τα circuits μπορούν να παρομοιαστούν περίπου σαν τις συναρτήσεις σε μια γλώσσα προγραμματισμού σαν την C. Μπορούν να επιστρέφουν ή όχι τιμές, ανάλογα με αυτό που ορίζει ο προγραμματιστής. Χωρίζονται σε δύο κατηγορίες: 
\begin{itemize}
    \item \textbf{pure circuits}: δεν αλλάζουν ούτε χρησιμοποιούν την private ή την public state (δηλαδή τις ledger μεταβλητές και τους witnesses),
    \item \textbf{impure circuits}: μπορούν να τροποποιούν και να χρησιμοποιούν την public και την private state. Τα impure circuits κατά κανόνα αποτελούν τις ενέργειες που μπορεί να κάνει ένας χρήστης στο smart contract, δηλαδή είναι τα entry points στο smart contract καθώς και τα transactions που μπορεί να εκτελέσει ένας χρήστης. Κάθε impure circuit μεταγλωττίζεται σε γλώσσα Typescript και μπορεί να χρησιμοποιηθεί σαν μια συνάρτηση Typescript.
\end{itemize}
Στο παράδειγμά μας pure circuit είναι το publicKey το οποίο λειτουργεί απλά σαν hash function αξιοποιώντας την συνάρτηση persistentHash της βιβλιοθήκης. Αυτό το cirtcuit χρησιμοποιείται για να υπολογιστεί το hash του secretKey.

Το impure circuits είναι το increment το οποίο προσπαθεί να αυξήσει την τιμή της ledger μεταβλητής counter. Ωστόσο μέσα σε αυτο το circuit παρατηρούμε ότι χρησιμοποείται η έκφραση \textbf{assert}. Κάθε τέτοια έκφραση που είναι σε ένα circuit αποτελεί τους κανόνες που ορίζει το smart contract και διέπουν τη λειτουργία του. Το συγκεκριμένο assert επιβάλλει ότι μόνο ο organizer του smart contract, δηλαδή αυτός που γνωρίζει ένα secretKey τέτοιο ώστε το hash αυτού του secretKey να ισούται με τη μεταβλητή organizer, έχει δικαίωμα να αυξήσει τον restrictedCounter. Διαφορετικά, αν ένας χρήστης που δεν γνωρίζει το έγκυρο secretKey προσπαθήσει να εκτελέσει ένα transaction με το increment circuit, αυτό θα αποτύχει και θα εμφανιστεί το μήνυμα λάθους "not authorized".



\end{document}

    """
    modified_text = insert_language_tags(sample_text)
    print(modified_text)