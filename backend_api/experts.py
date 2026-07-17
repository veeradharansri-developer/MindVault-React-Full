import re
import os

def scan_experts(hr_docs_dir=None):
    """
    Scans the HR documents folder for patterns indicating ownership, approval, or contact.
    Returns a dictionary mapping filename -> list of expert/contact names.
    """
    if hr_docs_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        hr_docs_dir = os.path.join(base_dir, "hr_docs")
    
    expert_map = {}
    if not os.path.exists(hr_docs_dir):
        return expert_map
    
    # Match patterns Approved by: NAME, Owned by: NAME, Contact: NAME
    pattern = re.compile(r"(?:Approved by|Owned by|Contact):\s*(.+)", re.IGNORECASE)
    
    for filename in os.listdir(hr_docs_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(hr_docs_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                names = []
                for line in content.splitlines():
                    match = pattern.search(line)
                    if match:
                        raw_val = match.group(1).strip()
                        name = raw_val
                        # Clean trailing description (e.g. ", Head of HR Operations")
                        if "," in name:
                            name = name.split(",")[0].strip()
                        # Clean trailing email indicators (e.g. " at hr@mindvault.ai")
                        if " at " in name:
                            name = name.split(" at ")[0].strip()
                        
                        if name and name not in names:
                            names.append(name)
                
                if names:
                    expert_map[filename] = names
            except Exception:
                # Silent fail to avoid showing raw stack traces to users
                pass
                
    return expert_map

def get_experts_for_sources(sources, hr_docs_dir=None):
    """
    Given a list of source filenames, returns a combined list of unique expert names.
    """
    expert_map = scan_experts(hr_docs_dir)
    matched_experts = set()
    for src in sources:
        # Resolve filenames (handling paths if sources have directories)
        filename = os.path.basename(src)
        if filename in expert_map:
            for expert in expert_map[filename]:
                matched_experts.add(expert)
    return sorted(list(matched_experts))
