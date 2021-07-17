// WTF why is this necessary?
// https://stackoverflow.com/questions/48187362/how-to-iterate-using-ngfor-loop-map-containing-key-as-string-and-values-as-map-i
// One simple solution to this is convert map to array : Array.from

export class Kvp {
  key = ''; // What we see in a drop down (Dictionary Word)
  value = 0; // Database Identity rather than a dictionary definition
}
